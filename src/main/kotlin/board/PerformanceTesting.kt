package board

import java.io.File
import kotlin.random.Random


fun main() {
	genBoards(32, 32, 300, 1000)
	/*do {
		val (avg, min, q1, med, q3, max) = measurePerformance(1, 5, width, height, mineCount)
		val density = mineCount.toFloat() / (width * height).toFloat()
		println("$mineCount, $density, $min, $q1, $med, $q3, $max, $avg")
		++mineCount

	} while (q3 < 0)*/
}

fun watchSolve() {
	val boards = BoardBuffer("boards/33x33-512.bds")
	val solver = Solver(boards[0])
	for (i in 0 until boards.size) {
		//println(boards[i].printableStr())
		solver.board = boards[i]
		solver.reset()
		val (sx, sy) = solver.solve()!!
		solver.reset()
		solver.revealSquare(sx, sy)
		solver.printProgress()
		while ((readLine() ?: "") != "n") {
			solver.bruteSolve()
			solver.printProgress()
		}
		println("next board")
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
	evalBoards(boards) {time, isSolvable, board ->
		//println("proved ${if (isSolvable) "solvable" else "unsolvable"} in $time seconds")
		if (isSolvable) {
			buffer += board
			++numSolvable
			totalSolvableTime += time
		} else {
			totalUnsolvableTime += time
		}
	}
	File("boards/${width}x$height-$mineCount.bds").writeBytes(buffer.internalBuffer.array())
	println("\n$numSolvable / $numBoards proved solvable")
	println("$totalSolvableTime seconds spent examining solvable boards (average ${totalSolvableTime / numSolvable})")
	println("$totalUnsolvableTime seconds spent examining unsolvable boards (average ${totalUnsolvableTime / (numBoards - numSolvable)})")
}

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
		val r = Random(seed + it)
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

	return PerformanceSummary(average, min, q1, median, q3, max)
}


fun evalBoards(boards : Array<Board>, r : (Float, Boolean, Board) -> Unit) {
	var solvable = false
	val solver = Solver(boards.first())
	for (board in boards) {
		val time = time {
			solver.board = board
			solver.reset()
			solvable = solver.solve() != null

		}
		r(time, solvable, board)
	}
}