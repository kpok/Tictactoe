import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Kółko i Krzyżyk';
  board = Array(9).fill('');
  currentPlayer = 'o';
  gameActive = true;

  handleCellClick(index: number): void {
    if (this.board[index] || !this.gameActive) return;

    this.board[index] = this.currentPlayer;
    if (this.checkWin()) {
      this.gameActive = false;
      alert(`${this.currentPlayer === 'o' ? 'Kółko' : 'Krzyżyk'} wygrał!`);
    } else if (this.board.every(cell => cell !== '')) {
      this.gameActive = false;
      alert('Remis!');
    } else {
      this.currentPlayer = this.currentPlayer === 'o' ? 'x' : 'o';
    }
  }

  checkWin(): boolean {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];

    return winPatterns.some(pattern => {
      const [a, b, c] = pattern;
      return this.board[a] === this.board[b] && this.board[b] === this.board[c] && this.board[a] !== '';
    });
  }

  resetGame(): void {
    this.board = Array(9).fill('');
    this.gameActive = true;
    this.currentPlayer = 'o';
  }
}
