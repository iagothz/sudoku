document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('sudoku-board');
    const newGameBtn = document.getElementById('new-game-btn');
    const solveBtn = document.getElementById('solve-btn');
    const checkBtn = document.getElementById('check-btn');
    const numberButtonsContainer = document.getElementById('number-buttons');
    const messageArea = document.getElementById('message-area');
    const difficultySelector = document.getElementById('difficulty-selector');
    const gameContainer = document.getElementById('game-container');
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeBtn = document.querySelector('.close-btn');
    const notesToggleBtn = document.getElementById('notes-toggle-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');

    let currentPuzzle = [];
    let solution = [];
    let selectedCellInput = null;
    let messageTimer;
    let currentDifficulty = 40;
    let isNotesMode = false;
    let notesData = createNotesData();

    function createNotesData() {
        return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    }

    function showMessage(text, type = 'info', duration = 4000) {
        clearTimeout(messageTimer);
        messageArea.textContent = text;
        messageArea.className = `message ${type}`;

        if (duration > 0) {
            messageTimer = setTimeout(() => {
                messageArea.textContent = '';
                messageArea.className = 'message';
            }, duration);
        }
    }
    function clearMessage() {
        clearTimeout(messageTimer);
        messageArea.textContent = '';
        messageArea.className = 'message';
    }

    function openModal() {
        settingsModal.classList.add('visible');
        modalOverlay.classList.add('visible');
    }

    function closeModal() {
        settingsModal.classList.remove('visible');
        modalOverlay.classList.remove('visible');
    }

    notesToggleBtn.addEventListener('click', () => {
        isNotesMode = !isNotesMode;
        notesToggleBtn.classList.toggle('active');
        gameContainer.classList.toggle('notes-mode-enabled');
        if (isNotesMode) {
            showMessage('Modo de Anotação ATIVADO', 'info', 1500);
        } else {
            showMessage('Modo de Anotação DESATIVADO', 'info', 1500);
        }
    });

    openSettingsBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && settingsModal.classList.contains('visible')) {
            closeModal();
        }
    });

    function createBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            const row = Math.floor(i / 9);
            const col = i % 9;

            const input = document.createElement('input');
            input.type = 'text';
            input.pattern = "[1-9]";
            input.maxLength = 1;
            input.dataset.row = row;
            input.dataset.col = col;

            input.addEventListener('input', handleDirectInput);
            input.addEventListener('focus', handleCellFocus);
            input.addEventListener('keydown', handleKeyDown);

            cell.appendChild(input);
            boardElement.appendChild(cell);
        }
    }

    function updateSelection(cellInputElement) {
        if (selectedCellInput) {
            selectedCellInput.parentElement.classList.remove('selected');
        }

        document.querySelectorAll('.cell.highlight-number').forEach(cell => {
            cell.classList.remove('highlight-number');
        });

        selectedCellInput = cellInputElement;
        selectedCellInput.parentElement.classList.add('selected');

        const row = parseInt(selectedCellInput.dataset.row);
        const col = parseInt(selectedCellInput.dataset.col);
        highlightPeers(row, col);

        document.querySelectorAll('.num-btn.active').forEach(btn => btn.classList.remove('active'));
        const valueInCell = selectedCellInput.value;
        if (valueInCell !== '') {
            document.querySelectorAll('.num-btn').forEach(btn => {
                if (btn.textContent === valueInCell) {
                    btn.classList.add('active');
                }
            });

            const allInputs = boardElement.querySelectorAll('input');
            allInputs.forEach(input => {
                if (input.value === valueInCell) {
                    input.parentElement.classList.add('highlight-number');
                }
            });
        }
    }

    difficultySelector.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('difficulty-btn')) {
            difficultySelector.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            target.classList.add('active');
            currentDifficulty = parseInt(target.dataset.difficulty);
            newGameBtn.click();
        }
    });

    function highlightPeers(row, col) {
        const allCells = boardElement.querySelectorAll('.cell');

        allCells.forEach(cell => {
            cell.classList.remove('highlight-block', 'highlight-row', 'highlight-col')
        }
        );

        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const blockPeer = boardElement.querySelector(`input[data-row='${startRow + i}'][data-col='${startCol + j}']`).parentElement;
                blockPeer.classList.add('highlight-block');
            }
        }

        for (let i = 0; i < 9; i++) {
            const rowPeer = boardElement.querySelector(`input[data-row='${row}'][data-col='${i}']`).parentElement;
            rowPeer.classList.add('highlight-row');

            const colPeer = boardElement.querySelector(`input[data-row='${i}'][data-col='${col}']`).parentElement;
            colPeer.classList.add('highlight-col');
        }


    }

    boardElement.addEventListener('click', (event) => {
        let targetElement = event.target;

        if (targetElement.classList.contains('cell')) {
            targetElement = targetElement.querySelector('input');
        }

        if (targetElement && targetElement.tagName === 'INPUT') {
            updateSelection(targetElement);
        }
    });

    window.addEventListener('click', (event) => {
        const isClickOutside = !boardElement.contains(event.target) &&
            !openSettingsBtn.contains(event.target) &&
            !darkModeToggle.contains(event.target) &&
            !numberButtonsContainer.contains(event.target);

        if (isClickOutside) {
            if (selectedCellInput) {
                selectedCellInput.parentElement.classList.remove('selected');
                selectedCellInput = null;
            }
            boardElement.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('highlight-row', 'highlight-col', 'highlight-block', 'highlight-number');
            });
        }
    });

    function handleCellFocus(event) {
        updateSelection(event.target);
    }

    numberButtonsContainer.addEventListener('click', (event) => {
        if (!event.target.classList.contains('num-btn')) return;
        if (!selectedCellInput || selectedCellInput.disabled) return;

        clearMessage();
        const row = parseInt(selectedCellInput.dataset.row);
        const col = parseInt(selectedCellInput.dataset.col);
        const num = event.target.textContent;

        if (isNotesMode) {
            const notes = notesData[row][col];

            if (num === 'X') {
                notes.clear();
            } else {
                if (notes.has(num)) {
                    notes.delete(num);
                } else {
                    notes.add(num);
                }
            }

            selectedCellInput.value = Array.from(notes).sort().join('');
            selectedCellInput.classList.add('notes-text');
            selectedCellInput.classList.remove('conflicting');

        } else {
            document.querySelectorAll('.num-btn.active').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            if (event.target.classList.contains('erase')) {
                selectedCellInput.value = '';
            } else {
                selectedCellInput.value = num;
            }

            notesData[row][col].clear();
            selectedCellInput.classList.remove('notes-text');

            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            selectedCellInput.dispatchEvent(inputEvent);
        }
    });

    function loadPuzzle(puzzle) {
        notesData = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));
        clearMessage();
        currentPuzzle = puzzle.map(row => [...row]);
        const inputs = boardElement.querySelectorAll('input');
        inputs.forEach(input => {
            input.parentElement.classList.remove('selected', 'conflicting');
        });

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const index = r * 9 + c;
                if (puzzle[r][c] !== 0) {
                    inputs[index].value = puzzle[r][c];
                    inputs[index].disabled = true;
                    inputs[index].parentElement.classList.add('initial');
                } else {
                    inputs[index].value = '';
                    inputs[index].disabled = false;
                    inputs[index].parentElement.classList.remove('initial');
                }
            }
        }
        selectedCellInput = null;
        document.querySelectorAll('.num-btn.active').forEach(btn => btn.classList.remove('active'));

        updateNumberButtonStates();
    }

    function handleDirectInput(event) {
        clearMessage();
        const input = event.target;
        let value = input.value;

        if (value !== '' && !/^[1-9]$/.test(value)) {
            input.value = '';
            return;
        }
        input.parentElement.classList.remove('conflicting');
        updateNumberButtonStates();
        saveGameState();
    }

    function handleKeyDown(event) {
        clearMessage();
        const input = event.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);

        if (event.key === "Backspace" || event.key === "Delete") {
            input.value = "";
            input.parentElement.classList.remove('conflicting');
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            input.dispatchEvent(inputEvent);
            event.preventDefault();
            updateNumberButtonStates();
            saveGameState();
        } else if (event.key.startsWith("Arrow")) {
            event.preventDefault();
            let nextRow = row, nextCol = col;
            if (event.key === "ArrowUp" && row > 0) nextRow--;
            else if (event.key === "ArrowDown" && row < 8) nextRow++;
            else if (event.key === "ArrowLeft" && col > 0) nextCol--;
            else if (event.key === "ArrowRight" && col < 8) nextCol++;

            const nextInput = boardElement.querySelector(`input[data-row='${nextRow}'][data-col='${nextCol}']`);
            if (nextInput) {
                nextInput.focus();
            }
        }
    }

    function updateNumberButtonStates() {
        const counts = {};
        for (let i = 1; i <= 9; i++) {
            counts[i] = 0;
        }
        const inputs = boardElement.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.value !== '') {
                const num = parseInt(input.value);
                if (counts[num] !== undefined) {
                    counts[num]++;
                }
            }
        });

        const allNumButtons = numberButtonsContainer.querySelectorAll('.num-btn:not(.erase)');
        allNumButtons.forEach(btn => {
            const num = parseInt(btn.textContent);
            if (counts[num] >= 9) {
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });
    }

    function isValid(board, row, col, num) {
        for (let x = 0; x < 9; x++) {
            if (x !== col && board[row][x] === num) return false;
        }
        for (let x = 0; x < 9; x++) {
            if (x !== row && board[x][col] === num) return false;
        }
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const curRow = startRow + i;
                const curCol = startCol + j;
                if (curRow !== row || curCol !== col) {
                    if (board[curRow][curCol] === num) return false;
                }
            }
        }
        return true;
    }

    function checkSolution() {
        clearMessage();
        const inputs = boardElement.querySelectorAll('input');
        let userBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        let isComplete = true;
        let hasConflicts = false;
        inputs.forEach(input => input.parentElement.classList.remove('conflicting'));

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const index = r * 9 + c;
                const value = inputs[index].value;
                if (value === '') {
                    isComplete = false;
                    userBoard[r][c] = 0;
                } else if (!/^[1-9]$/.test(value)) {
                    isComplete = false;
                    userBoard[r][c] = 0;
                    inputs[index].parentElement.classList.add('conflicting');
                    hasConflicts = true;
                }
                else {
                    userBoard[r][c] = parseInt(value);
                }
            }
        }
        if (!isComplete) {
            showMessage('Por favor, preencha todas as células para verificar.', 'info');
            return;
        }
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const num = userBoard[r][c];
                if (num !== 0) {
                    if (!isValid(userBoard, r, c, num)) {
                        hasConflicts = true;
                        const index = r * 9 + c;
                        if (!inputs[index].disabled) {
                            inputs[index].parentElement.classList.add('conflicting');
                        }
                    }
                }
            }
        }
        if (hasConflicts) {
            showMessage('Existem erros no seu preenchimento. Células em conflito destacadas.', 'error');
        } else {
            showMessage('Parabéns! Solução correta!', 'sucess');
        }
    }

    function solveBoard() {
        if (!solution || solution.length === 0) {
            showMessage("Solução não disponível para este quebra-cabeça no momento.", 'info');
            return;
        }
        loadPuzzle(solution);
        const inputs = boardElement.querySelectorAll('input');
        inputs.forEach(input => {
            input.disabled = true;
            input.parentElement.classList.add('initial');
            input.parentElement.classList.remove('conflicting', 'selected');
        });
        selectedCellInput = null;
        document.querySelectorAll('.num-btn.active').forEach(btn => btn.classList.remove('active'));
        updateNumberButtonStates();
    }

    function generateNewPuzzle(difficulty = 45) {
        let solution = Array(9).fill(null).map(() => Array(9).fill(0));
        fillBoard(solution);
        let puzzle = solution.map(row => [...row]);
        let positions = [];
        for (let i = 0; i < 81; i++) {
            positions.push(i);
        }
        shuffle(positions);
        let removedCount = 0;
        for (const pos of positions) {
            if (removedCount >= difficulty) {
                break;
            }
            const row = Math.floor(pos / 9);
            const col = pos % 9;
            const originalValue = puzzle[row][col];
            puzzle[row][col] = 0;
            let solutionCount = 0;
            function countSolutions(board) {
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (board[r][c] === 0) {
                            for (let num = 1; num <= 9 && solutionCount < 2; num++) {
                                if (isPlacementValid(board, r, c, num)) {
                                    board[r][c] = num;
                                    countSolutions(board);
                                    board[r][c] = 0;
                                }
                            }
                            return;
                        }
                    }
                }
                solutionCount++;
            }
            let puzzleCopy = puzzle.map(row => [...row]);
            countSolutions(puzzleCopy);

            if (solutionCount !== 1) {
                puzzle[row][col] = originalValue;
            } else {
                removedCount++;
            }
        }
        return { puzzle, solution }
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function isPlacementValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num || board[i][col] === num) {
                return false;
            }
        }
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    function fillBoard(board) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    shuffle(numbers);

                    for (const num of numbers) {
                        if (isPlacementValid(board, r, c, num)) {
                            board[r][c] = num;

                            if (fillBoard(board)) {
                                return true;
                            }

                            board[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    function getBoardState() {
        const board = Array(9).fill(null).map(() => Array(9).fill(0));
        const inputs = boardElement.querySelectorAll('input');
        inputs.forEach((input, i) => {
            const row = Math.floor(i / 9);
            const col = i % 9;
            if (input.value !== '') {
                board[row][col] = parseInt(input.value);
            }
        });
        return board;
    }

    function saveGameState() {
        const gameState = {
            currentBoard: getBoardState(),
            initialPuzzle: currentPuzzle,
            solution: solution,
            difficulty: currentDifficulty
        };
        localStorage.setItem('sudokuGameState', JSON.stringify(gameState));
    }

    function loadAndRestoreGame() {
        const savedStateJSON = localStorage.getItem('sudokuGameState');
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);

            currentPuzzle = savedState.initialPuzzle;
            solution = savedState.solution;
            currentDifficulty = savedState.difficulty;

            loadPuzzle(savedState.initialPuzzle);

            const inputs = boardElement.querySelectorAll('input');
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (savedState.initialPuzzle[r][c] === 0) {
                        const index = r * 9 + c;
                        if (savedState.currentBoard[r][c] !== 0) {
                            inputs[index].value = savedState.currentBoard[r][c];
                        }
                    }
                }
            }

            difficultySelector.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.dataset.difficulty) === savedState.difficulty) {
                    btn.classList.add('active');
                }
            });
            closeModal();
            updateNumberButtonStates();

            showMessage('Jogo anterior carregado!', 'success');
            return true;
        }
        return false;
    }

    function showConfirmModal() {
        confirmModal.style.display = 'block';
        modalOverlay.style.display = 'block';

        setTimeout(() => {
            confirmModal.classList.add('visible');
            modalOverlay.classList.add('visible');
        }, 10);
    }

    function hideConfirmModal() {
        confirmModal.classList.remove('visible');
        modalOverlay.classList.remove('visible');
        setTimeout(() => {
            confirmModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        }, 300);
    }
    confirmYesBtn.addEventListener('click', () => {
        loadAndRestoreGame();
        hideConfirmModal();
    });

    confirmNoBtn.addEventListener('click', () => {
        startNewGame();
        hideConfirmModal();
    });

    newGameBtn.addEventListener('click', startNewGame);
    solveBtn.addEventListener('click', solveBoard);
    checkBtn.addEventListener('click', checkSolution);

    createBoard();

    if (localStorage.getItem('sudokuGameState')) {
        showConfirmModal();
    } else {
        const initialGame = generateNewPuzzle(currentDifficulty);
        solution = initialGame.solution;
        loadPuzzle(initialGame.puzzle);
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        darkModeToggle.classList.toggle('active');
        if (document.body.classList.contains('dark-mode')) {
            darkModeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            darkModeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    });
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.classList.add('active');
        darkModeToggle.textContent = '☀️';
    }

    function startNewGame() {
        closeModal();
        localStorage.removeItem('sudokuGameState');
        showMessage('Gerando novo tabuleiro... Por favor, aguarde.', 'info', 0);
        setTimeout(() => {
            const newGame = generateNewPuzzle(currentDifficulty);
            solution = newGame.solution;
            loadPuzzle(newGame.puzzle);
            saveGameState();
        }, 50);
    }
});