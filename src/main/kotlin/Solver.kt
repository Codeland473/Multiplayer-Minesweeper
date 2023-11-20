class Solver(val board : Board) {
	val colors = IntArray(board.width * board.height) {-1}
	val squares = Array(board.width * board.height) {FrontSquare(it % board.width, it / board.width)}
	val totalMines = board.mineCounts.count { it == 9.toByte() }

	fun solve() : Pair<Int, Int>? {
		val numColors = fillColors()
		for (color in 0 until numColors) {
			colors.indices.filter { colors[it] == color }.forEach {i ->
				squares[i].reveal()
				if (board.mineCounts[i] != 0.toByte()) {
					board.adjacents(i % board.width)
						.map { (x, y) -> squares[idx(x, y)] }
						.filter { it.solverState == SolverState.UNKNOWN }
						.forEach { it.knowlegeState = KnowlegeState.FRONT }
				} else {
					squares[i].knowlegeState = KnowlegeState.SATISFIED
				}
			}
			heuristicSolve()
			var flaggedMines = 0
			if (squares.count {it.solverState == SolverState.FLAG} == totalMines)
				return xy(colors.indices.filter { colors[it] == color }.random())

		}
		return null
	}

	fun fillColors() : Int {
		var currentColor = 0
		for (i in colors.indices) {
			val x = i % board.width
			val y = i / board.width
			if (board.mineCounts[i] == 0.toByte() || colors[i] > 0) continue
			fillColor(x, y, currentColor++)
		}
		return currentColor
	}

	fun fillColor(x : Int, y : Int, color : Int) {
		if (colors[idx(x, y)] == color) return
		colors[idx(x, y)] = color
		if (board[x, y] == 0.toByte()) board.adjacents(x, y).forEach { (nx, ny) -> fillColor(nx, ny, color) }
	}

	fun feasable() : Boolean {
		squares.filter { it.solverState == SolverState.REVEALED && board[it.x, it.y] > 0 }.forEach {
			val min = board
				.adjacents(it.x, it.y)
				.count { (x, y) ->
					squares[idx(x, y)].solverState == SolverState.FLAG ||
							squares[idx(x, y)].solverState == SolverState.PENCIL_FLAG
				}
			if (min > board[it.x, it.y]) return false
			val max = min + board
				.adjacents(it.x, it.y)
				.count { (x, y) -> squares[idx(x, y)].solverState == SolverState.UNKNOWN }
			if (max < board[it.x, it.y]) return false
		}
		val min = squares.count { it.solverState.isFlag() }
		if (min > totalMines) return false
		val max = min + squares.count { it.solverState == SolverState.UNKNOWN }
		return max >= totalMines

	}

	fun heuristicSolve(pencil : Boolean = false, edge : List<FrontSquare> = squares.filter {it.knowlegeState == KnowlegeState.EDGE}) : Boolean {
		var steps = 0
		while (heuristicSolveStep()) ++steps
		return steps > 0
	}

	fun heuristicSolveStep(pencil : Boolean = false, edge : List<FrontSquare> = squares.filter { it.knowlegeState == KnowlegeState.EDGE }) : Boolean {
		var madeProgress = false
		edge.forEach { eSquare ->
			if (heuristicCheckSquare(eSquare, pencil)) madeProgress = true
		}
		return madeProgress
	}

	fun heuristicCheckSquare(eSquare : FrontSquare, pencil : Boolean = false) : Boolean {
		var nFlags = 0
		val unknowns = board.adjacents(eSquare.x, eSquare.y).filter { (x, y) ->
			if (squares[idx(x, y)].solverState.isFlag(pencil)) nFlags++
			squares[idx(x, y)].solverState == SolverState.UNKNOWN
		}
		if (nFlags.toByte() == board[eSquare.x, eSquare.y]) {
			unknowns.forEach {(x, y) ->
				val square = squares[idx(x, y)]
				square.solverState = if (pencil) SolverState.PENCIL_NOT_MINE else SolverState.REVEALED
				if (!pencil) {
					square.knowlegeState = KnowlegeState.EDGE
					board.adjacents(x, y).forEach { (ax, ay) -> squares[idx(ax, ay)].knowlegeState = KnowlegeState.FRONT }
					heuristicCheckSquare(square)
				}
			}
			return true
		} else if ((nFlags + unknowns.count()).toByte() == board[eSquare.x, eSquare.y]) {
			unknowns.forEach { (x, y) ->
				val square = squares[idx(x, y)]
				square.solverState = if (pencil) SolverState.PENCIL_FLAG else SolverState.FLAG
				if (!pencil) square.knowlegeState = KnowlegeState.SATISFIED
			}
			return true
		}
		return false
	}

	private fun idx(x : Int, y : Int) = x + y * board.width
	private fun xy(idx : Int) = Pair(idx % board.width, idx / board.width)
}

class FrontSquare(val x : Int, val y : Int) {
	var solverState = SolverState.UNKNOWN
	var knowlegeState = KnowlegeState.UNKNOWN

	fun reveal() {
		solverState = SolverState.REVEALED
		knowlegeState = KnowlegeState.EDGE
	}

	var mineShownPossible = false
	var safeShownPossible = false

	fun reset() {
		mineShownPossible = false
		safeShownPossible = false
	}
}

enum class SolverState {
	FLAG,
	PENCIL_FLAG,
	REVEALED,
	PENCIL_NOT_MINE,
	UNKNOWN;

	fun isFlag(acceptPencil : Boolean = true) : Boolean {
		return when (this) {
			FLAG -> true
			PENCIL_FLAG -> acceptPencil
			else -> false
		}
	}
}

enum class KnowlegeState {
	SATISFIED,
	EDGE,
	FRONT,
	UNKNOWN
}