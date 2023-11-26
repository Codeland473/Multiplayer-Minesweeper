import java.lang.Integer.min
import java.util.*
import java.util.Random as JRandom
import kotlin.collections.LinkedHashSet
import kotlin.concurrent.thread
import kotlin.random.asKotlinRandom
import kotlin.random.Random as KRandom

fun main() {
	//measurePerformance(10, 30, 16, 240)
	val width = 32
	val height = 32
	var mineCount = 472

	do {
		val (avg, min, q1, med, q3, max) = measurePerformance(0, 100, width, height, mineCount)
		val density = mineCount.toFloat() / (width * height).toFloat()
		println("$mineCount, $density, $min, $q1, $med, $q3, $max, $avg")
		++mineCount

	} while (q3 > 0)
	//measurePerformance(0, 20, width, height, mineCount)
	//measurePerformance(0, 10000)


	//println("normal")
	//val singlethreaded = measurePerformance(1, 5, 30, 16, mineCount)
	/*
	val board = Board(7, 3)
	board.mineCounts[0] = 9
	board.mineCounts[5] = 9
	board.mineCounts[7] = 9
	board.mineCounts[12] = 9
	board.mineCounts[16] = 9
	board.mineCounts[19] = 9
	board.setMinecounts()
	println(board.printableStr())
	val solvableLoc = Solver(board).solve()
	println(solvableLoc)

	 */

}

/*

average: 2.7642999649047852
min: 1.328
q1: 1.754
median: 2.824
q3: 3.958
max: 4.924

average: 2.00164999961853
min: 1.08
q1: 1.331
median: 1.53
q3: 3.296
max: 4.051

*/

/*
x2--2x-
x3113x-
??x??x-
 */

data class PerformanceSummary(val average : Double, val min : Float, val q1 : Float, val median : Float, val q3 : Float, val max : Float)

fun measurePerformance(
	threads : Int = 1,
	repetitions: Int = 10000,
	width : Int = 30,
	height : Int = 20,
	mineCount : Int = 130,
	seed : Long = 0L) : PerformanceSummary
{
	//val r = KRandom(seed)
	val timings = Array(repetitions) {
		val r = KRandom(seed + it)
		if (threads > 1) {
			time {
				val (board, startPos) = Solver.generateBoardMultithreaded(width, height, mineCount, r, threads)
				//println(board.printableStr())
			}
		} else if (threads == 1) {
			time {
				val board = Board(width, height)
				board.generateBoard(mineCount, true, r)
				//println(board.printableStr())
			}
		} else {
			time {
				val (board, startPos) = Solver.generateBoard(width, height, mineCount, r)
			}
		}
	}

	val average = timings.average()
	val sorted = timings.sorted()
	val min = timings.min()
	val q1 = sorted[repetitions / 4]
	val median = sorted[repetitions / 2]
	val q3 = sorted[3 * repetitions / 4]
	val max = timings.max()

	//println("$repetitions ${width}x${height}/$mineCount boards generated on $threads thread(s), performance summary:")
	//println("average: $average")
	//println("min: $min")
	//println("q1: $q1")
	//println("median: $median")
	//println("q3: $q3")
	//println("max: $max")
	return PerformanceSummary(average, min, q1, median, q3, max)
}

fun<T> time(f : () -> T) : Float {
	val before = System.currentTimeMillis()
	f()
	return (System.currentTimeMillis() - before).toFloat() / 1000f
}

class Solver(val board : Board, val r : KRandom = JRandom().asKotlinRandom()) {
	val regionIds = IntArray(board.width * board.height) {-1}
	val squares = Array(board.width * board.height) {FrontSquare(it % board.width, it / board.width, board[it])}
	val totalMines = board.mineCounts.count { it == 9.toByte() }

	var numFlags = 0
	var numPencilFlags = 0
	var numUnknown = board.width * board.height - 1

	fun getSolvableBoard() : Pair<Int, Int> {
		while (true) {
			solve()?.let { return it }
			board.generateBoard(totalMines, false, r)
			reset()
		}
	}

	fun reset() {
		regionIds.fill(-1)
		rewind()
	}

	fun rewind() {
		squares.indices.forEach { squares[it].reset(board[it]) }
		numFlags = 0
		numPencilFlags = 0
		numUnknown = board.width * board.height - 1
	}

	fun solve() : Pair<Int, Int>? {
		val numRegions = fillColors()
		val regionsVisited = Array(numRegions) {false}
		if (regionsVisited.isEmpty()) return null
		val regionStart = r.nextInt(regionsVisited.size)
		for (regionOffset in 0 until numRegions) {
			val region = (regionStart + regionOffset) % numRegions

			if (regionsVisited[region]) continue

			revealSquare(regionIds.indices.first { regionIds[it] == region })

			do {
				heuristicSolve()
				if (numFlags == totalMines ||
					squares.all { it.solverState == SolverState.REVEALED || board[it.x, it.y] == 9.toByte() }) {

					return xy(regionIds.indices.filter { regionIds[it] == region && board[it] == 0.toByte() }.random(r))
				}
			} while (bruteSolve())

			squares.indices.filter { squares[it].solverState == SolverState.REVEALED && board[it] == 0.toByte() }.forEach {
				regionsVisited[regionIds[it]] = true
			}
			rewind()
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
		if (board[x, y] > 0) return
		regionIds[idx(x, y)] = color
		board.adjacents(x, y).forEach { (nx, ny) -> fillColor(nx, ny, color) }
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
		val min = numFlags + numPencilFlags
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
			unknowns.forEach {(x, y) -> if (pencil) pencilRevealSquare(x, y) else revealSquare(x, y) }
			if (!pencil) eSquare.knowlegeState = KnowlegeState.SATISFIED
			return unknowns.isNotEmpty()
		} else if ((nFlags + unknowns.count()).toByte() == board[eSquare.x, eSquare.y]) {
			unknowns.forEach { (x, y) -> if (pencil) pencilFlagSquare(x, y) else flagSquare(x, y) }
			return true
		}
		return false
	}

	fun flagSquare(x : Int, y : Int)  = flagSquare(idx(x, y))
	fun flagSquare(idx : Int) {
		if (!board.isMine(idx)) throw RuntimeException("attempted to flag non-mine square")
		val square = squares[idx]
		square.solverState = SolverState.FLAG
		numFlags += 1
		square.knowlegeState = KnowlegeState.SATISFIED
	}

	fun pencilFlagSquare(x : Int, y : Int) = pencilFlagSquare(idx(x, y))
	fun pencilFlagSquare(idx : Int) {
		squares[idx].solverState = SolverState.PENCIL_FLAG
		numPencilFlags += 1
	}


	fun revealSquare(idx : Int) = revealSquare(idx % board.width, idx / board.width)
	fun revealSquare(x : Int, y : Int) {
		if (board.isMine(x, y)) throw RuntimeException("attempted to reveal mine square")
		val square = squares[idx(x, y)]
		square.solverState = SolverState.REVEALED

		square.knowlegeState = KnowlegeState.EDGE
		board.adjacents(x, y)
			.map { (ax, ay) -> squares[idx(ax, ay)] }
			.filter { it.knowlegeState == KnowlegeState.UNKNOWN }
			.forEach {
				numUnknown -= 1
				it.knowlegeState = KnowlegeState.FRONT
			}
		heuristicCheckSquare(square)
	}

	fun pencilRevealSquare(idx : Int) {
		val square = squares[idx]
		square.solverState = SolverState.PENCIL_SAFE
	}
	fun pencilRevealSquare(x : Int, y : Int) = pencilRevealSquare(idx(x, y))

	fun bruteSolve(front : List<FrontSquare> = squares.filter { it.knowlegeState == KnowlegeState.FRONT }) : Boolean {
		var minPencilFlags : Int = front.count { it.mineShownPossible }
		for (i in front.indices) {
			val fSquare = front[i]
			if (fSquare.safeShownPossible && fSquare.mineShownPossible) {
				continue
			}
			fSquare.solverState = if (board.isMine(fSquare.x, fSquare.y)) SolverState.PENCIL_SAFE else SolverState.PENCIL_FLAG
			heuristicSolve(true)
			if (!feasable() || !bruteStep(front)) {
				front.forEach { it.resetPencil(board[it.x, it.y]) }
				numPencilFlags = 0
				if (board.isMine(fSquare.x, fSquare.y)) flagSquare(fSquare.x, fSquare.y) else revealSquare(fSquare.x, fSquare.y)
				return true
			} else {
				minPencilFlags = min(minPencilFlags, numPencilFlags)
				front.forEach { it.savePencil() }
				numPencilFlags = 0
			}
		}
		front.forEach { it.resetPencil(board[it.x, it.y]) }
		numPencilFlags
		if (minPencilFlags + numFlags == totalMines && numUnknown > 0) {
			squares.forEach { if (it.knowlegeState == KnowlegeState.UNKNOWN) {
				--numUnknown
				revealSquare(it.x, it.y)
			} }
			return true
		}
		return false
	}

	fun bruteStep(front : List<FrontSquare>, startIndex : Int = 0) : Boolean {
		for (i in startIndex until front.size) {
			if (front[i].solverState == SolverState.UNKNOWN) {

				if (front[i].safeShownPossible) pencilFlagSquare(front[i].x, front[i].y) else pencilRevealSquare(front[i].x, front[i].y)
				heuristicSolve(true)
				if (!feasable() || !bruteStep(front, i + 1)) {
					front[i].solverState = if (front[i].safeShownPossible) {
						numPencilFlags -= 1
						SolverState.PENCIL_SAFE
					} else {
						numPencilFlags += 1
						SolverState.PENCIL_FLAG
					}
					if (!feasable() || !bruteStep(front, i + 1)) {
						if (!front[i].safeShownPossible) numPencilFlags -= 1
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
				val region = regionIds[idx(x, y)]
				val char = if (region < 0) " " else if (region < 10) region else Char((region - 10) + 'a'.code)
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

	companion object {

		fun generateBoard(width : Int, height : Int, mineCount : Int, r : KRandom = JRandom().asKotlinRandom()) : Pair<Board, Pair<Int, Int>> {
			val density = mineCount.toFloat() / (width * height).toFloat()
			return when {
				density >= 0.35 -> generateBoardMultithreaded(width, height, mineCount, r, 4)
				density >= 0.27 -> generateBoardMultithreaded(width, height, mineCount, r, 3)
				density >= 0.1 -> generateBoardMultithreaded(width, height, mineCount, r, 2)
				else -> generateBoardMultithreaded(width, height, mineCount, r, 1)
			}
		}

		fun generateBoardMultithreaded(width : Int, height : Int, mineCount : Int, r : KRandom = JRandom().asKotlinRandom(), numThreads : Int = 4) : Pair<Board, Pair<Int, Int>> {
			val boards = Collections.synchronizedSet<Pair<Board, Pair<Int, Int>>>(LinkedHashSet())
			val f = { ->
				val threadR = KRandom(r.nextLong())
				val board = Board(width, height)
				board.generateBoard(mineCount, false, threadR)
				val solver = Solver(board, threadR)

				while (boards.isEmpty()) {
					val startPos = solver.solve()
					if (startPos != null) {
						synchronized(boards) {
							boards.add(Pair(board, startPos))
						}
					} else {
						board.generateBoard(mineCount, false, threadR)
						solver.reset()
					}
				}
			}
			repeat(numThreads - 1) {
				thread(block = f)
			}
			f()
			return synchronized(boards) {boards.first()}
		}
	}
}

class FrontSquare(val x : Int, val y : Int, mineCount : Byte) {
	var solverState = SolverState.UNKNOWN
	var knowlegeState = KnowlegeState.UNKNOWN

	var mineShownPossible = mineCount == 9.toByte()
	var safeShownPossible = mineCount < 9

	fun reveal() {
		solverState = SolverState.REVEALED
		knowlegeState = KnowlegeState.EDGE
	}

	fun resetPencil(mineCount : Byte) {
		mineShownPossible = mineCount == 9.toByte()
		safeShownPossible = mineCount < 9
		if (solverState.isPencil()) solverState = SolverState.UNKNOWN
	}

	fun reset(mineCount : Byte) {
		mineShownPossible = mineCount == 9.toByte()
		safeShownPossible = mineCount < 9
		solverState = SolverState.UNKNOWN
		knowlegeState = KnowlegeState.UNKNOWN
	}

	fun savePencil() {
		when (solverState) {
			SolverState.PENCIL_FLAG -> mineShownPossible = true
			SolverState.PENCIL_SAFE -> safeShownPossible = true
			else -> throw RuntimeException("completed incomplete permutation")
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