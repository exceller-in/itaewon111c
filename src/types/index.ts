export interface Participant {
  number: string;
  isWinner: boolean;
}

export interface Prize {
  text: string; // 상품A_김OO 대표님 OO개
}

export interface Winner {
  number: string;
  prizeText: string;
  order: number;
}

export interface LotteryState {
  participants: Participant[];
  prizes: Prize[];
  winners: Winner[];
  drawCount: number;
  isDrawing: boolean;
  currentDrawResult: { number: string; prizeText: string }[];
}