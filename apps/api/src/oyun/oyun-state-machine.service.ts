import { Injectable, BadRequestException } from '@nestjs/common';
import { ToplulukDurumu, OyunAsamasi, OyunSonucu } from '@prisma/client';

// Timing constants (in milliseconds)
export const TIMING = {
  COUNTDOWN: 30000,           // 30 saniye lobi geri sayim
  BOT_FILL_INTERVAL: 2000,    // 2 saniye arayla bot ekleme
  EVENT_REVEAL: 5000,         // 5 saniye olay okuma
  PROPOSAL: 60000,            // 60 saniye oneri
  VOTING: 30000,              // 30 saniye oylama
  RESOLVE: 2000,              // 2 saniye hesaplama
  RESULTS: 5000,              // 5 saniye sonuc gosterimi
  DISCONNECT_LOBBY: 60000,    // 60 saniye lobi disconnect
  DISCONNECT_GAME: 300000,    // 5 dakika oyun askiya alma
} as const;

// Game configuration
export const GAME_CONFIG = {
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 8,
  MAX_TURNS: 10,
  INITIAL_RESOURCES: 50,
  MIN_RESOURCE: 0,
  MAX_RESOURCE: 100,
} as const;

// Tie-breaker score calculation
export interface TieBreakScore {
  proposalId: string;
  voteCount: number;
  hazineEtki: number;
  istikrarEtki: number;
  timestamp: Date;
  score: number;
}

// Result classification thresholds
export interface GameResult {
  sonuc: OyunSonucu;
  carpan: number;
  aciklama: string;
}

@Injectable()
export class OyunStateMachineService {

  // ==================== LOBBY STATE TRANSITIONS ====================

  /**
   * Check if lobby can transition to READY state
   */
  canTransitionToReady(playerCount: number): boolean {
    return playerCount >= GAME_CONFIG.MIN_PLAYERS;
  }

  /**
   * Check if lobby should transition back to WAITING
   */
  shouldTransitionToWaiting(playerCount: number): boolean {
    return playerCount < GAME_CONFIG.MIN_PLAYERS;
  }

  /**
   * Get allowed actions for lobby state
   */
  getLobbyAllowedActions(durum: ToplulukDurumu): string[] {
    switch (durum) {
      case ToplulukDurumu.BEKLEME:
      case ToplulukDurumu.LOBI: // backward compatibility
        return ['join', 'leave'];
      case ToplulukDurumu.HAZIR:
        return ['join', 'leave', 'start'];
      case ToplulukDurumu.GERI_SAYIM:
        return ['cancel'];
      case ToplulukDurumu.BOT_DOLDURMA:
        return [];
      case ToplulukDurumu.DEVAM_EDIYOR:
        return ['game_actions'];
      default:
        return [];
    }
  }

  // ==================== ROUND STATE TRANSITIONS ====================

  /**
   * Get next round state
   */
  getNextRoundState(currentState: OyunAsamasi): OyunAsamasi | null {
    const stateOrder: OyunAsamasi[] = [
      OyunAsamasi.OLAY_GOSTERILDI,
      OyunAsamasi.ONERI_ACIK,
      OyunAsamasi.OYLAMA_ACIK,
      OyunAsamasi.HESAPLAMA,
      OyunAsamasi.SONUCLAR,
      OyunAsamasi.TUR_KAPANDI,
    ];

    const currentIndex = stateOrder.indexOf(currentState);
    if (currentIndex === -1 || currentIndex === stateOrder.length - 1) {
      return null;
    }
    return stateOrder[currentIndex + 1];
  }

  /**
   * Get timeout for round state
   */
  getRoundStateTimeout(state: OyunAsamasi): number {
    switch (state) {
      case OyunAsamasi.OLAY_GOSTERILDI:
      case OyunAsamasi.OLAY_ACILISI: // backward compatibility
        return TIMING.EVENT_REVEAL;
      case OyunAsamasi.ONERI_ACIK:
      case OyunAsamasi.TARTISMA: // backward compatibility
        return TIMING.PROPOSAL;
      case OyunAsamasi.OYLAMA_ACIK:
      case OyunAsamasi.OYLAMA: // backward compatibility
        return TIMING.VOTING;
      case OyunAsamasi.HESAPLAMA:
        return TIMING.RESOLVE;
      case OyunAsamasi.SONUCLAR:
      case OyunAsamasi.TUR_SONU: // backward compatibility
        return TIMING.RESULTS;
      default:
        return 0;
    }
  }

  /**
   * Get allowed actions for round state
   */
  getRoundAllowedActions(state: OyunAsamasi): string[] {
    switch (state) {
      case OyunAsamasi.OLAY_GOSTERILDI:
      case OyunAsamasi.OLAY_ACILISI:
        return [];
      case OyunAsamasi.ONERI_ACIK:
      case OyunAsamasi.TARTISMA:
        return ['submitProposal'];
      case OyunAsamasi.OYLAMA_ACIK:
      case OyunAsamasi.OYLAMA:
        return ['castVote'];
      case OyunAsamasi.HESAPLAMA:
      case OyunAsamasi.SONUCLAR:
      case OyunAsamasi.TUR_SONU:
      case OyunAsamasi.TUR_KAPANDI:
        return [];
      default:
        return [];
    }
  }

  // ==================== TIE-BREAKER LOGIC ====================

  /**
   * Calculate tie-breaker score for a proposal
   * Formula: score = -hazineEtki + (istikrarEtki * 0.5) - (timestamp * 0.001)
   */
  calculateTieBreakScore(
    hazineEtki: number,
    istikrarEtki: number,
    timestamp: Date,
  ): number {
    // Lower hazine impact is better (negative means cost)
    // Higher istikrar impact is better
    // Earlier submission wins in case of tie
    const timestampFactor = timestamp.getTime() * 0.000001; // Very small factor
    return -hazineEtki + (istikrarEtki * 0.5) - timestampFactor;
  }

  /**
   * Select winning proposal with tie-breaker
   */
  selectWinningProposal(proposals: TieBreakScore[]): TieBreakScore | null {
    if (proposals.length === 0) return null;

    // Sort by vote count (descending), then by tie-break score (descending)
    const sorted = [...proposals].sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      return b.score - a.score;
    });

    return sorted[0];
  }

  /**
   * Handle voting timeout - set abstain for non-voters
   */
  handleVotingTimeout(
    voters: Set<string>,
    allPlayers: string[],
  ): { abstainers: string[] } {
    const abstainers = allPlayers.filter(playerId => !voters.has(playerId));
    return { abstainers };
  }

  /**
   * Handle proposal timeout - create "pass" proposals for non-submitters
   */
  getPassProposal(oyuncuId: string): {
    baslik: string;
    aciklama: string;
    hazineEtki: number;
    refahEtki: number;
    istikrarEtki: number;
    altyapiEtki: number;
  } {
    return {
      baslik: 'Eylem yok',
      aciklama: 'Oyuncu öneri yapmadı',
      hazineEtki: 0,
      refahEtki: 0,
      istikrarEtki: 0,
      altyapiEtki: 0,
    };
  }

  // ==================== GAME END CONDITIONS ====================

  /**
   * Check if game should end early (resource hit 0)
   */
  checkEarlyGameEnd(resources: {
    hazine: number;
    refah: number;
    istikrar: number;
    altyapi: number;
  }): { shouldEnd: boolean; reason?: string } {
    const { hazine, refah, istikrar, altyapi } = resources;

    if (hazine <= 0) return { shouldEnd: true, reason: 'Hazine tükendi' };
    if (refah <= 0) return { shouldEnd: true, reason: 'Refah çöktü' };
    if (istikrar <= 0) return { shouldEnd: true, reason: 'İstikrar bozuldu' };
    if (altyapi <= 0) return { shouldEnd: true, reason: 'Altyapı çöktü' };

    return { shouldEnd: false };
  }

  /**
   * Check if any resource hit 100 (Victory Moment)
   */
  checkVictoryMoment(resources: {
    hazine: number;
    refah: number;
    istikrar: number;
    altyapi: number;
  }): { hasVictory: boolean; resource?: string } {
    const { hazine, refah, istikrar, altyapi } = resources;

    if (hazine >= 100) return { hasVictory: true, resource: 'Hazine' };
    if (refah >= 100) return { hasVictory: true, resource: 'Refah' };
    if (istikrar >= 100) return { hasVictory: true, resource: 'İstikrar' };
    if (altyapi >= 100) return { hasVictory: true, resource: 'Altyapı' };

    return { hasVictory: false };
  }

  /**
   * Check if game should end normally (max turns reached)
   */
  shouldEndNormally(currentTurn: number): boolean {
    return currentTurn >= GAME_CONFIG.MAX_TURNS;
  }

  // ==================== RESULT CLASSIFICATION ====================

  /**
   * Classify game result based on resources
   * Uses min-based formula for fairness
   */
  classifyGameResult(
    resources: {
      hazine: number;
      refah: number;
      istikrar: number;
      altyapi: number;
    },
    earlyEnd: boolean = false,
  ): GameResult {
    const { hazine, refah, istikrar, altyapi } = resources;
    const values = [hazine, refah, istikrar, altyapi];
    const min = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    // Early end (resource hit 0) = COKTU
    if (earlyEnd || min <= 0) {
      return {
        sonuc: OyunSonucu.COKTU,
        carpan: 0.5,
        aciklama: 'Bir kaynak tükendi - Topluluk çöktü',
      };
    }

    // PARLADI: All resources >= 70
    if (min >= 70) {
      return {
        sonuc: OyunSonucu.PARLADI,
        carpan: 1.5,
        aciklama: 'Tüm kaynaklar 70+ - Mükemmel yönetim!',
      };
    }

    // GELISTI: min >= 45 AND avg >= 60
    if (min >= 45 && avg >= 60) {
      return {
        sonuc: OyunSonucu.GELISTI,
        carpan: 1.25,
        aciklama: 'İyi yönetim - Topluluk gelişti',
      };
    }

    // DURAGAN: min >= 25 AND avg 40-60
    if (min >= 25 && avg >= 40 && avg < 60) {
      return {
        sonuc: OyunSonucu.DURAGAN,
        carpan: 1.0,
        aciklama: 'İdare eder - Topluluk durağan',
      };
    }

    // GERILEDI: min < 25 OR avg < 40
    return {
      sonuc: OyunSonucu.GERILEDI,
      carpan: 0.75,
      aciklama: 'Kötü yönetim - Topluluk geriledi',
    };
  }

  /**
   * Calculate final score with multiplier
   */
  calculateFinalScore(
    baseScore: number,
    result: GameResult,
  ): number {
    return Math.round(baseScore * result.carpan);
  }

  // ==================== IDEMPOTENCY CHECKS ====================

  /**
   * Check if action is idempotent (repeated action should be ignored)
   */
  isIdempotentAction(
    action: string,
    state: OyunAsamasi | ToplulukDurumu,
  ): boolean {
    // These actions are idempotent - repeating them has no effect
    const idempotentActions = [
      'join', // Joining when already member
      'start', // Starting when already started
      'cancel', // Canceling when already canceled
    ];
    return idempotentActions.includes(action);
  }

  /**
   * Handle repeated proposal submission (update instead of create)
   */
  shouldUpdateProposal(existingProposal: boolean): boolean {
    // If player already submitted, update their proposal
    return existingProposal;
  }

  /**
   * Handle repeated vote (update instead of create)
   */
  shouldUpdateVote(existingVote: boolean): boolean {
    // If player already voted, update their vote
    return existingVote;
  }

  // ==================== DISCONNECT HANDLING ====================

  /**
   * Handle player disconnect in lobby
   */
  getLobbyDisconnectTimeout(): number {
    return TIMING.DISCONNECT_LOBBY;
  }

  /**
   * Handle player disconnect in game
   * Returns true if player should be replaced by bot
   */
  shouldReplacewithBot(disconnectDuration: number): boolean {
    // If disconnected for more than 30 seconds during game, replace with bot
    return disconnectDuration > 30000;
  }

  /**
   * Handle all players disconnect
   */
  getGameAbandonTimeout(): number {
    return TIMING.DISCONNECT_GAME;
  }

  // ==================== VALIDATION ====================

  /**
   * Validate self-vote (not allowed)
   */
  validateNotSelfVote(voterId: string, proposalOwnerId: string): void {
    if (voterId === proposalOwnerId) {
      throw new BadRequestException('Kendi önerinize oy veremezsiniz');
    }
  }

  /**
   * Validate action is allowed in current state
   */
  validateActionAllowed(
    action: string,
    state: OyunAsamasi | ToplulukDurumu,
    isLobby: boolean,
  ): void {
    const allowedActions = isLobby
      ? this.getLobbyAllowedActions(state as ToplulukDurumu)
      : this.getRoundAllowedActions(state as OyunAsamasi);

    if (!allowedActions.includes(action)) {
      throw new BadRequestException(
        `Bu işlem mevcut durumda yapılamaz: ${action} (durum: ${state})`,
      );
    }
  }

  /**
   * Clamp resource value between 0 and 100
   */
  clampResource(value: number): number {
    return Math.max(GAME_CONFIG.MIN_RESOURCE, Math.min(GAME_CONFIG.MAX_RESOURCE, value));
  }
}
