// Przechowuje stan gry
let board = Array(9).fill(null);
let playerOCount = 0;
let playerXCount = 0;
let currentPlayer = 'O'; // Zaczyna gracz O

// Zwraca status gry (zwycięzca lub remisy)
function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // wiersze
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // kolumny
    [0, 4, 8], [2, 4, 6] // przekątne
  ];

  for (let [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // Zwycięzca (O lub X)
    }
  }
  return null;
}

// Sprawdza, czy plansza jest pełna (remis)
function isBoardFull(board) {
  return board.every(cell => cell !== null);
}

// Aktualizuje status gry
function updateStatus() {
  const status = document.getElementById('status');
  const winner = checkWinner(board);
  
  if (winner) {
    status.textContent = `Gracz ${winner} wygrał!`;
  } else if (isBoardFull(board)) {
    status.textContent = 'Remis!';
  } else {
    status.textContent = `Tura gracza: ${currentPlayer}`;
  }
}

// Obsługuje kliknięcie w komórkę planszy
function handleCellClick(index) {
  if (board[index] || checkWinner(board)) return; // Komórka już zajęta lub gra zakończona

  // Ustawienie symbolu gracza
  board[index] = currentPlayer;

  // Zwiększenie licznika symboli
  if (currentPlayer === 'O') {
    playerOCount++;
  } else {
    playerXCount++;
  }

  // Przełączamy turę
  currentPlayer = currentPlayer === 'O' ? 'X' : 'O';

  // Zaktualizowanie UI
  document.querySelectorAll('.cell')[index].textContent = board[index];
  document.querySelectorAll('.cell')[index].disabled = true;

  // Zaktualizowanie statusu gry
  updateStatus();
}

// Inicjalizacja gry
function initGame() {
  board = Array(9).fill(null);
  playerOCount = 0;
  playerXCount = 0;
  currentPlayer = 'O';

  document.querySelectorAll('.cell').forEach((cell, index) => {
    cell.textContent = '';
    cell.disabled = false;
    cell.addEventListener('click', () => handleCellClick(index));
  });

  updateStatus();
}

// Obsługuje resetowanie gry
function resetGame() {
  initGame();
}

// Rozpocznij grę
window.onload = () => {
  initGame();

  // Obsługa kliknięcia przycisku resetu
  const resetButton = document.getElementById('resetButton');
  resetButton.addEventListener('click', resetGame);
};
