package board

import io.ktor.util.*
import java.io.File
import kotlin.math.max
import kotlin.random.Random

val bruteEvalPerformancePairs = ArrayList<Triple<Int, Float, Boolean>>()

fun<T> time(f : () -> T) : Pair<Float, T> {
	val before = System.currentTimeMillis()
	val r = f()
	return Pair((System.currentTimeMillis() - before).toFloat() / 1000f, r)
}

fun main() {
	//genBoards(32, 32, 300, 100)

	/*val boardStrs = arrayOf(
		/*"""
			--x-----xx
			-xxx-xxx--
			x--xx-----
			xx---x-xxx
			x-x--x----
			xx--------
			-x----x---
			x---------
			--x-xxxx--
			xx--x----x
		""",
		"""
			--x--x--xx
			-------xxx
			---x-x--x-
			x------x--
			-xxx----x-
			----x---x-
			--xxx-x-xx
			xx-x-----x
			x--x------
			x---xxx-x-
		""",
		"""
			x--xxxxxx-
			-----x----
			-x----x-x-
			x---xx----
			--x---x-xx
			x--------x
			x------xxx
			x-x----x--
			xxx----x--
			--xxx----x
		""",
		"""
			--xx-x-x--
			----------
			x-xx---x--
			--------x-
			---------x
			-x----x--x
			--x----x--
			----x--x--
			--xx------
			----x-x--x
		""",
		"""
			xx--------
			x---------
			--x-------
			----------
			----------
			----------
			----------
			----------
			----------
			----------
		""",
		"""
			----------
			-x--------
			--x-------
			----------
			----------
			----------
			----------
			----------
			----------
			----------
		""",*/
		"""
			-----x----------xx---xxx-x-xx-
			-x----x----x-x-x----x----x----
			--x-------------x------xx---xx
			------------x-------x--x-----x
			-x-----x-------x-x--x----x----
			------x---x-x----x---xxx------
			-------xx-----x--x---------x--
			----xx--x--------x---x-x-----x
			---x---x----x------------x-x--
			-x-xxx-----x------x--x--------
			------x-----x--------------xxx
			x-x-------xx-------x----------
			x------x-------x---x-x--x---x-
			----------------xx---------xx-
			x-----x------------x-x-x-xx---
			--x--x------x----x-xx---x-x---
		"""
	).map{it.filter { it in "-x" }}*/

	/*for (boardStr in boardStrs) {
		val board = Board(30, 15, boardStr.map { (if (it == 'x') 9 else 0).toByte() }.toByteArray())
		board.setMinecounts()
		println(board.printableStr())
		println(Solver(board).solve())//
	}
	*/
	//val solvableBoards = BoardBuffer("boards/evilSolvable.bds")

	val boardStr = """
		--x-----xx
		-x--------
		---x------
		-x--------
		--x--x----
		-x----x---
		-----x----
		--x-----x-
		----------
		-x--x-----
	""".filter { it in "-x" }
	val board = Board(10, 10, boardStr.map { (if (it == 'x') 9 else 0).toByte() }.toByteArray())
	board.setMinecounts()
	println(board.printableStr())
	println(Solver(board).solve())

	/*val perfSummaryFile = File("docs/performanceSummary30x20.csv").bufferedWriter()

	perfSummaryFile.write("Mine Count, Density, N, " +
			"Time Min, Time Q1, Time Median, Time Q3, Time Max, Time Mean, " +
			"3BV Min, 3BV Q1, 3BV Median, 3BV Median, 3BV Max, 3BV Mean, " +
			"Diff Solves Min, Diff Solves Q1, Diff Solves Median, Diff Solves Q3, Diff Solves Max, Diff Solves Mean, " +
			"Brute Solves Min, Brute Solves Q1, Brute Solves Median, Brute Solves Q3, Brute Solves Max, Brute Solves Mean\n")

	val width = 30
	val height = 20
	var mineCount = 30
	var n = 10000
	do {
		val times = Array(n) {0f}
		val tbvs = Array(n) {0}
		val diffSolves = Array(n) {0}
		val bruteSolves = Array(n) {0}

		measurePerformance(1, n, width, height, mineCount, 0L) {board, time, i ->
			times[i] = time
			tbvs[i] = board.stats!!.tBV
			diffSolves[i] = board.stats!!.diffSolves
			bruteSolves[i] = board.stats!!.bruteSolves
		}
		val density = mineCount.toFloat() / (width * height).toFloat()
		val timeNS = NumberSummary(times)
		val tbvNS = NumberSummary(tbvs)
		val diffNS = NumberSummary(diffSolves)
		val bruteNS = NumberSummary(bruteSolves)
		perfSummaryFile.write("$mineCount, $density, $n, ${timeNS.csvString()}, ${tbvNS.csvString()}, ${diffNS.csvString()}, ${bruteNS.csvString()}\n")
		perfSummaryFile.flush()
		println("""
			
			
------------------------------------------------------------------------------------------------------------------------
			Finished Measuring performance for $mineCount mines
			
			Density: $density
			N: $n
			
			Statistic summaries:
			Time         : $timeNS
			3BV          : $tbvNS
			Diff Solves  : $diffNS
			Brute Solves : $bruteNS
		""".trimIndent())

		while (n > 100 && timeNS.average * n > 60 * 5) {
			n -= 100
		}

		++mineCount

	} while (timeNS.average < 60)*/
}

fun Solver.solveMeasuringTime(b : Board) : Pair<Int, Int>? {
	this.board = b
	reset()
	val numRegions = fillRegions()
	if (numRegions == 0) return null
	val regionStart = r.nextInt(numRegions)
	for (regionOffset in 0 until numRegions) {
		val region = (regionStart + regionOffset) % numRegions

		if (regionsVisited[region]) continue

		revealSquare(regionIds.indices.first { regionIds[it] == region })

		do {
			logicSolves()
			if (satisfied()) {
				return xy(regionIds.indices.filter { regionIds[it] == region && board[it] == 0.toByte() }.random(r))
			}
			var frontSize = 0
			val (t, bruteSolveProgress) = time {
				val front = squares.filter { it.knowledgeState == KnowledgeState.FRONT }
				frontSize = front.size
				bruteSolve()
			}
			bruteEvalPerformancePairs += Triple(frontSize, t, bruteSolveProgress)

		} while (bruteSolveProgress)

		markSatisfiedRegions()
		rewind()
	}
	return null
}

fun Solver.watchSolve(b : Board) : Pair<Int, Int>? {
	this.board = b
	reset()
	val numRegions = fillRegions()
	if (numRegions == 0) return null
	val regionStart = r.nextInt(numRegions)
	for (regionOffset in 0 until numRegions) {
		val region = (regionStart + regionOffset) % numRegions

		if (regionsVisited[region]) continue

		revealSquare(regionIds.indices.first { regionIds[it] == region })
		do {
			printProgress()
			if ((readLine() ?: "n") == "n") break
			logicSolves()
			if (satisfied()) {
				return xy(regionIds.indices.filter { regionIds[it] == region && board[it] == 0.toByte() }.random(r))
			}
			printProgress()
			if ((readLine() ?: "n") == "n") break

		} while (bruteSolve())

		markSatisfiedRegions()
		rewind()
	}
	return null
}

fun watchSolve(b : Board, s : Solver = Solver(b)) {
	val numRegions = s.fillRegions()
	val visitedRegions = BooleanArray(numRegions) {false}
	for (i in 0 until numRegions) {
		if (visitedRegions[i]) continue
		s.revealSquare(s.regionIds.indices.filter { s.regionIds[it] == i }.first())
		s.printProgress()
		do {
			if ((readLine() ?: "n") == "n") break

			val (t, trivialProgress) = time { s.trivialSolve() }
			if (trivialProgress) {
				s.printProgress()
				println("trivial solver made progress in $t seconds")
			} else {
				println("trivial solver failed in $t seconds")
				val (t, diffProgress) = time { s.diffSolve() }
				if (diffProgress) {
					s.printProgress()
					println("diff solver made progress in $t seconds")
				} else {
					println("diff solver failed in $t seconds")
					val (t, bruteProgress) = time { s.bruteSolve() }
					if (bruteProgress) {
						s.printProgress()
						println("brute solver made progress in $t seconds")
					} else {
						println("brute solver failed in $t seconds")
						break
					}
				}
			}
		} while (true)
		println("done with region")
		s.squares.indices
			.filter { s.squares[it].solverState == SolverState.REVEALED }
			.map { s.regionIds[it] }
			.forEach { if (it in visitedRegions.indices) visitedRegions[it] = true }
		println(visitedRegions.joinToString { if (it) "true" else "false" })
		s.rewind()
	}
}
fun genBoards(width : Int, height : Int, mineCount : Int, numBoards : Int) {

	//board.measurePerformance(10, 30, 16, 240)

	val buffer = BoardBuffer(width, height)

	val r = Random(1)
	val boards = Array(numBoards) {
		val b = Board(width, height)
		b.generateBoard(mineCount, false, r)
		b
	}
	var totalSolvableTime = 0f
	var totalUnsolvableTime = 0f
	var numSolvable = 0
	var i = 0
	evalBoards(boards) {time, isSolvable, board ->
		println("proved $i ${if (isSolvable) "solvable" else "unsolvable"} in $time seconds")
		if (isSolvable) {
			buffer += board
			++numSolvable
			totalSolvableTime += time
		} else {
			totalUnsolvableTime += time
		}
		++i
	}
	//File("boards/${width}x$height-$mineCount.bds").writeBytes(buffer.internalBuffer.array())
	println("\n$numSolvable / $numBoards proved solvable")
	println("$totalSolvableTime seconds spent examining solvable boards (average ${totalSolvableTime / numSolvable})")
	println("$totalUnsolvableTime seconds spent examining unsolvable boards (average ${totalUnsolvableTime / (numBoards - numSolvable)})")
}

data class NumberSummary(val average : Double, val min : Float, val q1 : Float, val median : Float, val q3 : Float, val max : Float) {
	constructor(ns : List<Number>) : this(
		ns.sumOf { it.toDouble() } / ns.size,
		ns.minOf { it.toFloat() },
		ns.sortedBy { it.toFloat() }[ns.size / 4].toFloat(),
		ns.sortedBy { it.toFloat() }[ns.size / 2].toFloat(),
		ns.sortedBy { it.toFloat() }[3 * ns.size / 4].toFloat(),
		ns.maxOf { it.toFloat() }
	)

	constructor(ns : Array<Int>) : this(
		ns.sumOf { it.toDouble() } / ns.size,
		ns.minOf { it.toFloat() },
		ns.sortedBy { it.toFloat() }[ns.size / 4].toFloat(),
		ns.sortedBy { it.toFloat() }[ns.size / 2].toFloat(),
		ns.sortedBy { it.toFloat() }[3 * ns.size / 4].toFloat(),
		ns.maxOf { it.toFloat() }
	)

	constructor(ns : Array<Float>) : this(
		ns.sumOf { it.toDouble() } / ns.size,
		ns.minOf { it },
		ns.sortedBy { it }[ns.size / 4],
		ns.sortedBy { it }[ns.size / 2],
		ns.sortedBy { it }[3 * ns.size / 4],
		ns.maxOf { it }
	)

	override fun toString(): String {
		return "($min, $q1, $median, $q3, $max), μ: $average"
	}

	fun csvString() : String {
		return "$min, $q1, $median, $q3, $max, $average"
	}
}

fun measurePerformance(
	threads : Int = 1,
	repetitions: Int = 10000,
	width : Int = 30,
	height : Int = 20,
	mineCount : Int = 130,
	seed : Long = 0L, f : (Board, Float, Int) -> Unit)
{
	//val r = KRandom(seed)
	repeat(repetitions) {
		val r = Random(seed + it)
		if (threads > 1) {
			val (t, board) = time {
				val (board, _) = Solver.generateBoardMultithreaded(width, height, mineCount, 0, 0, r, threads)
				board
			}
			f(board, t, it)
		} else if (threads == 1) {
			val (t, board) = time {
				val board = Board(width, height)
				board.generateBoard(mineCount, true, r)
				//println(board.printableStr())
				board
			}
			f(board, t, it)
		} else {
			val (t, board) = time {
				val (board, _) = Solver.generateBoard(width, height, mineCount, 0, 0, r)
				board
			}
			f(board, t, it)
		}
	}
}


fun evalBoards(boards : Array<Board>, r : (Float, Boolean, Board) -> Unit) {
	var solvable = false
	val solver = Solver(boards.first())
	for (board in boards) {
		val (time, _) = time {
			solver.board = board
			solver.reset()
			solvable = solver.solve() != null

		}
		r(time, solvable, board)
	}
}