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

	val boardStrs = arrayOf(
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
	).map{it.filter { it in "-x" }}

	/*for (boardStr in boardStrs) {
		val board = Board(30, 15, boardStr.map { (if (it == 'x') 9 else 0).toByte() }.toByteArray())
		board.setMinecounts()
		println(board.printableStr())
		println(Solver(board).solve())//
	}
	*/
	//val solvableBoards = BoardBuffer("boards/evilSolvable.bds")

	val r = Random(0)
	val n = 100000
	val boards = Array(n) {
		val b = Board(30, 20)
		b.generateBoard(130, false, r)
		b
	}

	var totalT = 0f

	var totalSolvable = 0

	var maxT = 0f


	//val (avg, min, q1, med, q3, max) = measurePerformance(1, 1000, 30, 20, 130)
//16304
	//println("$min, $q1, $med, $q3, $max, $avg")
	//val evilBoards = BoardBuffer(30, 20)
	//val priceyBoards = BoardBuffer(30, 20)
	val ng3bvs = ArrayList<Int>()
	val trivials = ArrayList<Int>()
	val diffs = ArrayList<Int>()
	val brutes = ArrayList<Int>()
	val guessing3bvs = ArrayList<Int>()
	
	for (i in 0 until n) {
		//s.watchSolve(boards[i])
		val s = Solver(boards[i], Random(0))

		val (t, isSolvable) = time {s.solve() != null}
		maxT = max(t, maxT)
		totalT += t
		//if (t > 1) {
			//println("board[$i] isSolvable $isSolvable found in $t s")
			//priceyBoards += boards[i]
		//}
		if (isSolvable) {
			trivials.add(s.trivialSolves)
			diffs.add(s.diffSolves)
			brutes.add(s.bruteSolves)
			ng3bvs += s.calculate3BV()
			++totalSolvable
			//evilBoards += boards[i]
		} else {
			guessing3bvs += s.calculate3BV()
		}
		/*if (i - lastPrintedI >= 1000) {
			println("nothing new in last 1000 boards, current board : #$i, current average : ${totalT / i}")
			lastPrintedI = i
		}*/
	}

	println("$totalSolvable / $n solvable avg ${totalT / n}, max time spend on one: $maxT")

	//File("boards/evilSolvable.bds").writeBytes(evilBoards.internalBuffer.array())
	//File("boards/evilPricey.bds").writeBytes(priceyBoards.internalBuffer.array())

	println("ng 3bvs: ${NumberSummary(ng3bvs)}")
	println("ge 3bvs: ${NumberSummary(guessing3bvs)}")
	println("ng trivial solves: ${NumberSummary(trivials)}")
	println("ng diff    solves: ${NumberSummary(diffs)}")
	println("ng brute   solves: ${NumberSummary(brutes)}")

	val boardsOfInterest = arrayOf(
		63, // : 1.6s
		371, // : 285s
		1039, // : 15.6s
		1577, // : 7.4s
		1893, // : 153s
		2630, // : 66.8s
		3517, // : 39.3s
		6047, // : 1528
		56725, // : 9049s
		72767, // : 3336s
	)

	/*for (boardI in boardsOfInterest) {
		val s = Solver(boards[boardI], Random(0))

		val (t, isSolvable) = time {s.solve() != null}
		println("board[$boardI] isSolvable $isSolvable found in $t s")

	}*/
	/*
	63 : 1.6s
	371 : 285s
	1039 : 15.6s
	1577 : 7.4s
	1893 : 153s
	2630 : 66.8s
	3517 : 39.3s
	6047 : 1528
	56725 : 9049s
	72767 : 3336s

	24810 : solvable
	*/

	//val f = File("docs/brutePerformance.csv").bufferedWriter()
	//f.write("front size, time (seconds), progress\n")
	//for ((frontSize, speed, progress) in bruteEvalPerformancePairs) {
	//	f.write("$frontSize, $speed, $progress\n")
	//}
	//f.flush()
	//f.close()


	/*do {
		val (avg, min, q1, med, q3, max) = measurePerformance(1, 5, width, height, mineCount)
		val density = mineCount.toFloat() / (width * height).toFloat()
		println("$mineCount, $density, $min, $q1, $med, $q3, $max, $avg")
		++mineCount

	} while (q3 < 0)*/
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
}

fun measurePerformance(
	threads : Int = 1,
	repetitions: Int = 10000,
	width : Int = 30,
	height : Int = 20,
	mineCount : Int = 130,
	seed : Long = 0L) : NumberSummary
{
	//val r = KRandom(seed)
	val timings = Array(repetitions) {
		val r = Random(seed + it)
		if (threads > 1) {
			val (t, _) = time {
				val (board, startPos) = Solver.generateBoardMultithreaded(width, height, mineCount, 0, 0, r, threads)
				//println(board.printableStr())
			}
			t
		} else if (threads == 1) {
			val (t, _) = time {
				val board = Board(width, height)
				board.generateBoard(mineCount, true, r)
				//println(board.printableStr())
			}
			t
		} else {
			val (t, _) = time {
				val (board, startPos) = Solver.generateBoard(width, height, mineCount, 0, 0, r)
			}
			t
		}
	}

	return NumberSummary(timings)
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