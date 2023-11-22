import kotlin.random.Random

fun main() {
	measurePerformance(10, 30, 16, 240)
}

fun measurePerformance(repetitions: Int = 10000, width : Int = 30, height : Int = 20, mineCount : Int = 130) {
	val timings = Array(repetitions) {
		val time = time {
			val board = Board(width, height)
			board.generateBoard(mineCount, false)
			val solver = Solver(board)
			val start = solver.getSolvableBoard()
			println(board.printableStr())
		}
		time
	}

	val average = timings.average()
	val sorted = timings.sorted()
	val min = timings.min()
	val q1 = sorted[repetitions / 4]
	val median = sorted[repetitions / 2]
	val q3 = sorted[3 * repetitions / 4]
	val max = timings.max()
	println("$repetitions ${width}x${height}/$mineCount boards generated, performance summary:")
	println("average: $average")
	println("min: $min")
	println("q1: $q1")
	println("median: $median")
	println("q3: $q3")
	println("max: $max")
}

fun<T> time(f : () -> T) : Float {
	val before = System.currentTimeMillis()
	f()
	return (System.currentTimeMillis() - before).toFloat() / 1000f
}

class Solver(val board : Board) {
	val regionIds = IntArray(board.width * board.height) {-1}
	val squares = Array(board.width * board.height) {FrontSquare(it % board.width, it / board.width, board[it])}
	val totalMines = board.mineCounts.count { it == 9.toByte() }

	fun getSolvableBoard() : Pair<Int, Int> {
		while (true) {
			solve()?.let { return it }
			board.generateBoard(totalMines, false)
			regionIds.fill(-1)
			squares.indices.forEach { squares[it].reset(board[it], false) }
		}
	}

	fun solve() : Pair<Int, Int>? {
		val numRegions = fillColors()
		val regionsVisited = Array(numRegions) {false}
		val regionStart = Random.nextInt(regionsVisited.size)
		for (regionOffset in 0 until numRegions) {
			val region = (regionStart + regionOffset) % numRegions

			if (regionsVisited[region]) continue
			regionIds.indices.filter { regionIds[it] == region }.forEach { i ->
				squares[i].reveal()
				if (board.mineCounts[i] != 0.toByte()) {
					board.adjacents(i)
						.map { (x, y) -> squares[idx(x, y)] }
						.filter { it.solverState == SolverState.UNKNOWN }
						.forEach { it.knowlegeState = KnowlegeState.FRONT }
				} else {
					squares[i].knowlegeState = KnowlegeState.SATISFIED
				}
			}
			do {
				heuristicSolve()
				if (squares.count {it.solverState == SolverState.FLAG} == totalMines ||
					squares.all { it.solverState == SolverState.REVEALED || board[it.x, it.y] == 9.toByte() }) {

					return xy(regionIds.indices.filter { regionIds[it] == region && board[it] == 0.toByte() }.random())
				}
			} while (bruteSolve())

			squares.indices.filter { squares[it].solverState == SolverState.REVEALED && board[it] == 0.toByte() }.forEach {
				regionsVisited[regionIds[it]] = true
			}
		}
		return null
	}

	fun fillColors() : Int {
		var currentColor = 0
		for (i in regionIds.indices) {
			val x = i % board.width
			val y = i / board.width
			if (board.mineCounts[i] != 0.toByte() || regionIds[i] >= 0) continue
			fillColor(x, y, currentColor++)
		}
		return currentColor
	}

	fun fillColor(x : Int, y : Int, color : Int) {
		if (regionIds[idx(x, y)] == color) return
		regionIds[idx(x, y)] = color
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
		while (heuristicSolveStep(pencil, edge)) ++steps
		return steps > 0
	}

	fun heuristicSolveStep(pencil : Boolean = false, edge : List<FrontSquare> = squares.filter { it.knowlegeState == KnowlegeState.EDGE }) : Boolean {
		var madeProgress = false
		edge.forEach { eSquare ->
			if (heuristicCheckSquare(eSquare, pencil)) {
				madeProgress = true
			}
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
			unknowns.forEach {(x, y) -> revealSquare(x, y, pencil) }
			if (!pencil) eSquare.knowlegeState = KnowlegeState.SATISFIED
			return unknowns.isNotEmpty()
		} else if ((nFlags + unknowns.count()).toByte() == board[eSquare.x, eSquare.y]) {
			unknowns.forEach { (x, y) -> flagSquare(x, y, pencil) }
			return true
		}
		return false
	}

	fun flagSquare(x : Int, y : Int, pencil : Boolean = false)  = flagSquare(idx(x, y), pencil)
	fun flagSquare(idx : Int, pencil : Boolean = false) {
		val square = squares[idx]
		square.solverState = if (pencil) SolverState.PENCIL_FLAG else SolverState.FLAG
		if (!pencil) {
			square.knowlegeState = KnowlegeState.SATISFIED
		}
	}

	fun revealSquare(x : Int, y : Int, pencil : Boolean = false) {
		val square = squares[idx(x, y)]
		square.solverState = if (pencil) SolverState.PENCIL_SAFE else SolverState.REVEALED
		if (!pencil) {
			square.knowlegeState = KnowlegeState.EDGE
			board.adjacents(x, y)
				.map { (ax, ay) -> squares[idx(ax, ay)] }
				.filter { it.knowlegeState == KnowlegeState.UNKNOWN }
				.forEach { it.knowlegeState = KnowlegeState.FRONT }
			heuristicCheckSquare(square)
		}
	}
	fun revealSquare(idx : Int, pencil : Boolean = false) = revealSquare(idx % board.width, idx / board.width, pencil)

	fun bruteSolve(front : List<FrontSquare> = squares.filter { it.knowlegeState == KnowlegeState.FRONT }) : Boolean {
		var numUnknown = 0
		var numFlags = 0
		squares.forEach {
			if (it.solverState == SolverState.FLAG) ++numFlags
			if (it.knowlegeState == KnowlegeState.UNKNOWN) ++numUnknown
		}
		for (i in front.indices) {
			val fSquare = front[i]
			if (fSquare.safeShownPossible && fSquare.mineShownPossible) {
				continue
			}
			fSquare.solverState = if (board.isMine(fSquare.x, fSquare.y)) SolverState.PENCIL_SAFE else SolverState.PENCIL_FLAG
			heuristicSolve(true)
			if (!feasable() || !bruteStep(front)) {
				front.forEach { it.reset(board[it.x, it.y]) }
				if (board.isMine(fSquare.x, fSquare.y)) flagSquare(fSquare.x, fSquare.y) else revealSquare(fSquare.x, fSquare.y)
				return true
			} else {
				front.forEach { it.savePencil() }
			}
		}
		return false
	}

	fun bruteStep(front : List<FrontSquare>, startIndex : Int = 0) : Boolean {
		for (i in startIndex until front.size) {
			if (front[i].solverState == SolverState.UNKNOWN) {
				front[i].solverState = if (front[i].safeShownPossible) SolverState.PENCIL_FLAG else SolverState.PENCIL_SAFE
				heuristicSolve(true)
				if (!feasable() || !bruteStep(front, i + 1)) {
					front[i].solverState = if (front[i].safeShownPossible) SolverState.PENCIL_SAFE else SolverState.PENCIL_FLAG
					if (!feasable() || !bruteStep(front, i + 1)) {
						front[i].solverState = SolverState.UNKNOWN
						return false
					}
				}
				return true
			}
		}
		return true
	}

	fun printRegions() {
		val builder = StringBuilder()
		builder.append("${"-".repeat(board.width + 2)}\n")
		repeat(board.height) { y ->
			builder.append("|")
			repeat(board.width) {x ->
				val color = regionIds[idx(x, y)]
				val char = if (color < 0) " " else if (color < 10) color else Char((color - 10) + 'a'.code)
				builder.append(char)
			}
			builder.append("|\n")
		}
		builder.append("-".repeat(board.width + 2))
		print(builder.toString())
	}

	fun printProgress() {
		val builder = StringBuilder()
		builder.append("${"-".repeat(board.width + 2)}\n")
		repeat(board.height) { y ->
			builder.append("|")
			repeat(board.width) {x ->
				val color = regionIds[idx(x, y)]
				var char = when(board[x, y]) {
					0.toByte() -> '-'
					9.toByte() -> 'X'
					else -> board[x, y].toInt().toString()
				}
				char = when (squares[idx(x, y)].solverState) {
					SolverState.FLAG -> 'F'
					SolverState.PENCIL_FLAG -> 'f'
					SolverState.PENCIL_SAFE -> 's'
					SolverState.REVEALED -> char
					else -> ' '
				}
				builder.append(char)
			}
			builder.append("|\n")
		}
		builder.append("-".repeat(board.width + 2))
		println(builder.toString())
	}

	fun printKnowlege() {
		val builder = StringBuilder()
		builder.append("${"-".repeat(board.width + 2)}\n")
		repeat(board.height) { y ->
			builder.append("|")
			repeat(board.width) {x ->
				val color = regionIds[idx(x, y)]
				var char = when(board[x, y]) {
					0.toByte() -> '-'
					9.toByte() -> 'X'
					else -> board[x, y].toInt().toString()
				}
				char = when (squares[idx(x, y)].knowlegeState) {
					KnowlegeState.UNKNOWN -> ' '
					KnowlegeState.FRONT -> 'F'
					KnowlegeState.EDGE -> 'E'
					KnowlegeState.SATISFIED -> char
				}
				builder.append(char)
			}
			builder.append("|\n")
		}
		builder.append("-".repeat(board.width + 2))
		println(builder.toString())
	}

	private fun idx(x : Int, y : Int) = x + y * board.width
	private fun xy(idx : Int) = Pair(idx % board.width, idx / board.width)
}

class FrontSquare(val x : Int, val y : Int, mineCount : Byte) {
	var solverState = SolverState.UNKNOWN
	var knowlegeState = KnowlegeState.UNKNOWN

	fun reveal() {
		solverState = SolverState.REVEALED
		knowlegeState = KnowlegeState.EDGE
	}

	var mineShownPossible = mineCount == 9.toByte()
	var safeShownPossible = mineCount < 9

	fun reset(mineCount : Byte, pencilOnly : Boolean = true) {
		if (solverState.isPencil() || !pencilOnly) {
			mineShownPossible = mineCount == 9.toByte()
			safeShownPossible = mineCount < 9
			solverState = SolverState.UNKNOWN
			if (!pencilOnly) knowlegeState = KnowlegeState.UNKNOWN
		}
	}

	fun savePencil() {
		when (solverState) {
			SolverState.PENCIL_FLAG -> mineShownPossible = true
			SolverState.PENCIL_SAFE -> safeShownPossible = true
			else -> throw RuntimeException("WER MY PENISIL AT?")
		}
		solverState = SolverState.UNKNOWN
	}
}

enum class SolverState {
	FLAG,
	PENCIL_FLAG,
	REVEALED,
	PENCIL_SAFE,
	UNKNOWN;

	fun isFlag(acceptPencil : Boolean = true) : Boolean {
		return when (this) {
			FLAG -> true
			PENCIL_FLAG -> acceptPencil
			else -> false
		}
	}

	fun isPencil() : Boolean {
		return when (this) {
			PENCIL_FLAG -> true
			PENCIL_SAFE -> true
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