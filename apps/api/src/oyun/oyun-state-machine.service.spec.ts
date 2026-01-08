import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  OyunStateMachineService,
  TIMING,
  GAME_CONFIG,
  TieBreakScore,
} from './oyun-state-machine.service';
import { ToplulukDurumu, OyunAsamasi, OyunSonucu } from '@prisma/client';

describe('OyunStateMachineService', () => {
  let service: OyunStateMachineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OyunStateMachineService],
    }).compile();

    service = module.get<OyunStateMachineService>(OyunStateMachineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== TIMING CONSTANTS ====================
  describe('TIMING constants', () => {
    it('should have correct countdown time', () => {
      expect(TIMING.COUNTDOWN).toBe(30000); // 30 seconds
    });

    it('should have correct proposal time', () => {
      expect(TIMING.PROPOSAL).toBe(60000); // 60 seconds
    });

    it('should have correct voting time', () => {
      expect(TIMING.VOTING).toBe(30000); // 30 seconds
    });
  });

  // ==================== GAME CONFIG ====================
  describe('GAME_CONFIG constants', () => {
    it('should require minimum 4 players', () => {
      expect(GAME_CONFIG.MIN_PLAYERS).toBe(4);
    });

    it('should allow maximum 8 players', () => {
      expect(GAME_CONFIG.MAX_PLAYERS).toBe(8);
    });

    it('should have 10 turns maximum', () => {
      expect(GAME_CONFIG.MAX_TURNS).toBe(10);
    });

    it('should start with 50 initial resources', () => {
      expect(GAME_CONFIG.INITIAL_RESOURCES).toBe(50);
    });
  });

  // ==================== LOBBY STATE TRANSITIONS ====================
  describe('Lobby State Transitions', () => {
    describe('canTransitionToReady', () => {
      it('should return true when player count >= MIN_PLAYERS', () => {
        expect(service.canTransitionToReady(4)).toBe(true);
        expect(service.canTransitionToReady(5)).toBe(true);
        expect(service.canTransitionToReady(8)).toBe(true);
      });

      it('should return false when player count < MIN_PLAYERS', () => {
        expect(service.canTransitionToReady(0)).toBe(false);
        expect(service.canTransitionToReady(1)).toBe(false);
        expect(service.canTransitionToReady(3)).toBe(false);
      });
    });

    describe('shouldTransitionToWaiting', () => {
      it('should return true when player count < MIN_PLAYERS', () => {
        expect(service.shouldTransitionToWaiting(0)).toBe(true);
        expect(service.shouldTransitionToWaiting(3)).toBe(true);
      });

      it('should return false when player count >= MIN_PLAYERS', () => {
        expect(service.shouldTransitionToWaiting(4)).toBe(false);
        expect(service.shouldTransitionToWaiting(8)).toBe(false);
      });
    });

    describe('getLobbyAllowedActions', () => {
      it('should allow join and leave in BEKLEME state', () => {
        const actions = service.getLobbyAllowedActions(ToplulukDurumu.BEKLEME);
        expect(actions).toContain('join');
        expect(actions).toContain('leave');
        expect(actions).not.toContain('start');
      });

      it('should allow join, leave, and start in HAZIR state', () => {
        const actions = service.getLobbyAllowedActions(ToplulukDurumu.HAZIR);
        expect(actions).toContain('join');
        expect(actions).toContain('leave');
        expect(actions).toContain('start');
      });

      it('should only allow cancel in GERI_SAYIM state', () => {
        const actions = service.getLobbyAllowedActions(ToplulukDurumu.GERI_SAYIM);
        expect(actions).toContain('cancel');
        expect(actions).not.toContain('join');
      });

      it('should allow no actions in BOT_DOLDURMA state', () => {
        const actions = service.getLobbyAllowedActions(ToplulukDurumu.BOT_DOLDURMA);
        expect(actions.length).toBe(0);
      });
    });
  });

  // ==================== ROUND STATE TRANSITIONS ====================
  describe('Round State Transitions', () => {
    describe('getNextRoundState', () => {
      it('should return correct next states', () => {
        expect(service.getNextRoundState(OyunAsamasi.OLAY_GOSTERILDI)).toBe(OyunAsamasi.ONERI_ACIK);
        expect(service.getNextRoundState(OyunAsamasi.ONERI_ACIK)).toBe(OyunAsamasi.OYLAMA_ACIK);
        expect(service.getNextRoundState(OyunAsamasi.OYLAMA_ACIK)).toBe(OyunAsamasi.HESAPLAMA);
        expect(service.getNextRoundState(OyunAsamasi.HESAPLAMA)).toBe(OyunAsamasi.SONUCLAR);
        expect(service.getNextRoundState(OyunAsamasi.SONUCLAR)).toBe(OyunAsamasi.TUR_KAPANDI);
      });

      it('should return null for last state', () => {
        expect(service.getNextRoundState(OyunAsamasi.TUR_KAPANDI)).toBeNull();
      });
    });

    describe('getRoundStateTimeout', () => {
      it('should return correct timeouts', () => {
        expect(service.getRoundStateTimeout(OyunAsamasi.OLAY_GOSTERILDI)).toBe(TIMING.EVENT_REVEAL);
        expect(service.getRoundStateTimeout(OyunAsamasi.ONERI_ACIK)).toBe(TIMING.PROPOSAL);
        expect(service.getRoundStateTimeout(OyunAsamasi.OYLAMA_ACIK)).toBe(TIMING.VOTING);
        expect(service.getRoundStateTimeout(OyunAsamasi.HESAPLAMA)).toBe(TIMING.RESOLVE);
        expect(service.getRoundStateTimeout(OyunAsamasi.SONUCLAR)).toBe(TIMING.RESULTS);
      });
    });

    describe('getRoundAllowedActions', () => {
      it('should allow submitProposal in ONERI_ACIK state', () => {
        const actions = service.getRoundAllowedActions(OyunAsamasi.ONERI_ACIK);
        expect(actions).toContain('submitProposal');
      });

      it('should allow castVote in OYLAMA_ACIK state', () => {
        const actions = service.getRoundAllowedActions(OyunAsamasi.OYLAMA_ACIK);
        expect(actions).toContain('castVote');
      });

      it('should allow no actions in HESAPLAMA state', () => {
        const actions = service.getRoundAllowedActions(OyunAsamasi.HESAPLAMA);
        expect(actions.length).toBe(0);
      });
    });
  });

  // ==================== TIE-BREAKER LOGIC ====================
  describe('Tie-Breaker Logic', () => {
    describe('calculateTieBreakScore', () => {
      it('should prefer lower hazine impact', () => {
        const score1 = service.calculateTieBreakScore(-10, 5, new Date(1000));
        const score2 = service.calculateTieBreakScore(-5, 5, new Date(1000));
        expect(score1).toBeGreaterThan(score2);
      });

      it('should prefer higher istikrar impact', () => {
        const score1 = service.calculateTieBreakScore(0, 10, new Date(1000));
        const score2 = service.calculateTieBreakScore(0, 5, new Date(1000));
        expect(score1).toBeGreaterThan(score2);
      });

      it('should prefer earlier submissions', () => {
        const earlier = new Date(1000);
        const later = new Date(2000);
        const score1 = service.calculateTieBreakScore(0, 0, earlier);
        const score2 = service.calculateTieBreakScore(0, 0, later);
        expect(score1).toBeGreaterThan(score2);
      });
    });

    describe('selectWinningProposal', () => {
      it('should return null for empty array', () => {
        expect(service.selectWinningProposal([])).toBeNull();
      });

      it('should select proposal with highest vote count', () => {
        const proposals: TieBreakScore[] = [
          { proposalId: 'a', voteCount: 2, hazineEtki: 0, istikrarEtki: 0, timestamp: new Date(), score: 0 },
          { proposalId: 'b', voteCount: 5, hazineEtki: 0, istikrarEtki: 0, timestamp: new Date(), score: 0 },
          { proposalId: 'c', voteCount: 3, hazineEtki: 0, istikrarEtki: 0, timestamp: new Date(), score: 0 },
        ];
        const winner = service.selectWinningProposal(proposals);
        expect(winner?.proposalId).toBe('b');
      });

      it('should use tie-break score when vote counts are equal', () => {
        const proposals: TieBreakScore[] = [
          { proposalId: 'a', voteCount: 3, hazineEtki: 0, istikrarEtki: 0, timestamp: new Date(), score: 5 },
          { proposalId: 'b', voteCount: 3, hazineEtki: 0, istikrarEtki: 0, timestamp: new Date(), score: 10 },
        ];
        const winner = service.selectWinningProposal(proposals);
        expect(winner?.proposalId).toBe('b');
      });
    });

    describe('handleVotingTimeout', () => {
      it('should identify non-voters as abstainers', () => {
        const voters = new Set(['player1', 'player2']);
        const allPlayers = ['player1', 'player2', 'player3', 'player4'];
        const result = service.handleVotingTimeout(voters, allPlayers);
        expect(result.abstainers).toContain('player3');
        expect(result.abstainers).toContain('player4');
        expect(result.abstainers).not.toContain('player1');
      });
    });
  });

  // ==================== GAME END CONDITIONS ====================
  describe('Game End Conditions', () => {
    describe('checkEarlyGameEnd', () => {
      it('should end when hazine is 0', () => {
        const result = service.checkEarlyGameEnd({ hazine: 0, refah: 50, istikrar: 50, altyapi: 50 });
        expect(result.shouldEnd).toBe(true);
        expect(result.reason).toContain('Hazine');
      });

      it('should end when refah is 0', () => {
        const result = service.checkEarlyGameEnd({ hazine: 50, refah: 0, istikrar: 50, altyapi: 50 });
        expect(result.shouldEnd).toBe(true);
        expect(result.reason).toContain('Refah');
      });

      it('should end when istikrar is 0', () => {
        const result = service.checkEarlyGameEnd({ hazine: 50, refah: 50, istikrar: 0, altyapi: 50 });
        expect(result.shouldEnd).toBe(true);
        expect(result.reason).toContain('İstikrar');
      });

      it('should end when altyapi is 0', () => {
        const result = service.checkEarlyGameEnd({ hazine: 50, refah: 50, istikrar: 50, altyapi: 0 });
        expect(result.shouldEnd).toBe(true);
        expect(result.reason).toContain('Altyapı');
      });

      it('should not end when all resources > 0', () => {
        const result = service.checkEarlyGameEnd({ hazine: 50, refah: 50, istikrar: 50, altyapi: 50 });
        expect(result.shouldEnd).toBe(false);
      });
    });

    describe('checkVictoryMoment', () => {
      it('should detect victory when hazine is 100', () => {
        const result = service.checkVictoryMoment({ hazine: 100, refah: 50, istikrar: 50, altyapi: 50 });
        expect(result.hasVictory).toBe(true);
        expect(result.resource).toBe('Hazine');
      });

      it('should detect victory when any resource is 100', () => {
        const result = service.checkVictoryMoment({ hazine: 50, refah: 100, istikrar: 50, altyapi: 50 });
        expect(result.hasVictory).toBe(true);
        expect(result.resource).toBe('Refah');
      });

      it('should not detect victory when all resources < 100', () => {
        const result = service.checkVictoryMoment({ hazine: 99, refah: 99, istikrar: 99, altyapi: 99 });
        expect(result.hasVictory).toBe(false);
      });
    });

    describe('shouldEndNormally', () => {
      it('should end at MAX_TURNS', () => {
        expect(service.shouldEndNormally(10)).toBe(true);
        expect(service.shouldEndNormally(11)).toBe(true);
      });

      it('should not end before MAX_TURNS', () => {
        expect(service.shouldEndNormally(9)).toBe(false);
        expect(service.shouldEndNormally(1)).toBe(false);
      });
    });
  });

  // ==================== RESULT CLASSIFICATION ====================
  describe('Result Classification', () => {
    describe('classifyGameResult', () => {
      it('should return COKTU when early end', () => {
        const result = service.classifyGameResult({ hazine: 0, refah: 50, istikrar: 50, altyapi: 50 }, true);
        expect(result.sonuc).toBe(OyunSonucu.COKTU);
        expect(result.carpan).toBe(0.5);
      });

      it('should return COKTU when min resource is 0', () => {
        const result = service.classifyGameResult({ hazine: 0, refah: 50, istikrar: 50, altyapi: 50 });
        expect(result.sonuc).toBe(OyunSonucu.COKTU);
        expect(result.carpan).toBe(0.5);
      });

      it('should return PARLADI when all resources >= 70', () => {
        const result = service.classifyGameResult({ hazine: 70, refah: 80, istikrar: 75, altyapi: 90 });
        expect(result.sonuc).toBe(OyunSonucu.PARLADI);
        expect(result.carpan).toBe(1.5);
      });

      it('should return GELISTI when min >= 45 and avg >= 60', () => {
        const result = service.classifyGameResult({ hazine: 45, refah: 70, istikrar: 65, altyapi: 60 });
        expect(result.sonuc).toBe(OyunSonucu.GELISTI);
        expect(result.carpan).toBe(1.25);
      });

      it('should return DURAGAN when min >= 25 and 40 <= avg < 60', () => {
        const result = service.classifyGameResult({ hazine: 30, refah: 50, istikrar: 45, altyapi: 40 });
        expect(result.sonuc).toBe(OyunSonucu.DURAGAN);
        expect(result.carpan).toBe(1.0);
      });

      it('should return GERILEDI when min < 25 or avg < 40', () => {
        const result = service.classifyGameResult({ hazine: 20, refah: 30, istikrar: 25, altyapi: 35 });
        expect(result.sonuc).toBe(OyunSonucu.GERILEDI);
        expect(result.carpan).toBe(0.75);
      });
    });

    describe('calculateFinalScore', () => {
      it('should multiply base score by carpan', () => {
        const result = { sonuc: OyunSonucu.PARLADI, carpan: 1.5, aciklama: '' };
        expect(service.calculateFinalScore(100, result)).toBe(150);
      });

      it('should round to nearest integer', () => {
        const result = { sonuc: OyunSonucu.GELISTI, carpan: 1.25, aciklama: '' };
        expect(service.calculateFinalScore(33, result)).toBe(41); // 33 * 1.25 = 41.25 → 41
      });
    });
  });

  // ==================== VALIDATION ====================
  describe('Validation', () => {
    describe('validateNotSelfVote', () => {
      it('should throw when voter is proposal owner', () => {
        expect(() => service.validateNotSelfVote('player1', 'player1')).toThrow(BadRequestException);
      });

      it('should not throw when voter is different from owner', () => {
        expect(() => service.validateNotSelfVote('player1', 'player2')).not.toThrow();
      });
    });

    describe('clampResource', () => {
      it('should clamp values to 0-100 range', () => {
        expect(service.clampResource(-10)).toBe(0);
        expect(service.clampResource(0)).toBe(0);
        expect(service.clampResource(50)).toBe(50);
        expect(service.clampResource(100)).toBe(100);
        expect(service.clampResource(150)).toBe(100);
      });
    });
  });

  // ==================== DISCONNECT HANDLING ====================
  describe('Disconnect Handling', () => {
    describe('shouldReplacewithBot', () => {
      it('should replace after 30 seconds', () => {
        expect(service.shouldReplacewithBot(31000)).toBe(true);
        expect(service.shouldReplacewithBot(60000)).toBe(true);
      });

      it('should not replace within 30 seconds', () => {
        expect(service.shouldReplacewithBot(29000)).toBe(false);
        expect(service.shouldReplacewithBot(0)).toBe(false);
      });
    });
  });
});
