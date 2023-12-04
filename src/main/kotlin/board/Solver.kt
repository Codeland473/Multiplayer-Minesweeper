package board

import java.lang.Integer.max
import java.lang.Integer.min
import java.util.*
import kotlin.collections.ArrayList
import java.util.Random as JRandom
import kotlin.collections.LinkedHashSet
import kotlin.concurrent.thread
import kotlin.math.abs
import kotlin.random.asKotlinRandom
import kotlin.random.Random as KRandom

class Solver(var board : Board, val r : KRandom = JRandom().asKotlinRandom()) {
	val regionIds = IntArray(board.width * board.height) {-1}
	var regionsVisited = Array(0) {false}
	val squares = Array(board.width * board.height) { FrontSquare(it % board.width, it / board.width, board[it]) }
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

	fun calculate3BV() : Int {
		val numRegions = fillRegions()
		return numRegions + squares.indices.count {
			!board.isMine(it) && board.adjacents(it).all { (ax, ay) -> regionIds[idx(ax, ay)] == -1 }
		}
	}

	fun solve() : Pair<Int, Int>? {
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
			} while (bruteSolve())

			markSatisfiedRegions()
			rewind()
		}
		return null
	}

	fun fillRegions() : Int {
		var currentID = 0
		for (i in regionIds.indices) {
			val x = i % board.width
			val y = i / board.width
			if (board.mineCounts[i] != 0.toByte() || regionIds[i] >= 0) continue
			fillColor(x, y, currentID++)
		}

		regionsVisited = Array(currentID) {false}
		return currentID
	}

	fun markSatisfiedRegions() {
		squares.indices.filter { squares[it].solverState == SolverState.REVEALED && board[it] == 0.toByte() }.forEach {
			regionsVisited[regionIds[it]] = true
		}
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

	fun satisfied() : Boolean {
		return numFlags == totalMines ||
			squares.all { it.solverState == SolverState.REVEALED || board[it.x, it.y] == 9.toByte() }
	}

	fun logicSolves(pencil : Boolean = false) {
		do {
			trivialSolve(pencil)
		} while (diffSolve(pencil))
	}

	fun trivialSolve(pencil : Boolean = false) : Boolean {
		var ret = false
		while (trivialSolveList(pencil)) ret = true
		return ret
	}

	fun trivialSolveList(pencil : Boolean = false, edge : List<FrontSquare> = squares.filter {it.knowledgeState == KnowledgeState.EDGE }) : Boolean {
		var steps = 0
		while (trivialSolveStep(pencil, edge)) ++steps
		return steps > 0
	}

	fun trivialSolveStep(pencil : Boolean = false, edge : List<FrontSquare> = squares.filter { it.knowledgeState == KnowledgeState.EDGE }) : Boolean {
		var madeProgress = false
		edge.forEach { eSquare ->
			if (trivialSolveSquare(eSquare, pencil)) {
				madeProgress = true
			}
		}
		return madeProgress
	}

	fun trivialSolveSquare(eSquare : FrontSquare, pencil : Boolean = false) : Boolean {
		var nFlags = 0
		val unknowns = board.adjacents(eSquare.x, eSquare.y).filter { (x, y) ->
			if (squares[idx(x, y)].solverState.isFlag(pencil)) nFlags++
			squares[idx(x, y)].solverState == SolverState.UNKNOWN
		}
		if (nFlags.toByte() == board[eSquare.x, eSquare.y]) {
			unknowns.forEach {(x, y) -> if (pencil) pencilRevealSquare(x, y) else revealSquare(x, y) }
			if (!pencil) eSquare.knowledgeState = KnowledgeState.SATISFIED
			return unknowns.isNotEmpty()
		} else if ((nFlags + unknowns.count()).toByte() == board[eSquare.x, eSquare.y]) {
			unknowns.forEach { (x, y) -> if (pencil) pencilFlagSquare(x, y) else flagSquare(x, y) }
			return true
		}
		return false
	}

	fun trivialSolveRegion(squares : List<FrontSquare>, numMines : Int, pencil : Boolean = false) : Boolean {
		var madeProgress = false
		val nFlags = squares.count { it.solverState.isFlag(pencil) }
		if (nFlags == numMines) squares.filter { it.solverState == SolverState.UNKNOWN }.forEach {
			madeProgress = true
			if (pencil) pencilRevealSquare(it.x, it.y) else revealSquare(it.x, it.y)
		}
		val nUnknowns = squares.count { it.solverState == SolverState.UNKNOWN }
		if (nFlags + nUnknowns == numMines) squares.filter { it.solverState == SolverState.UNKNOWN }.forEach {
			madeProgress = true
			if (pencil) pencilFlagSquare(it.x, it.y) else flagSquare(it.x, it.y)
		}
		return madeProgress
	}

	fun diffSolve(pencil: Boolean = false, eSquares : List<FrontSquare> = squares.filter { it.knowledgeState == KnowledgeState.EDGE }) : Boolean {
		return eSquares.any { diffSolveSquare(it, pencil) }
	}

	fun diffSolveSquare(eSquare : FrontSquare, pencil : Boolean = false) : Boolean {
		val adjacents = board.adjacents(eSquare.x, eSquare.y)
			.map { (ax, ay) -> squares[idx(ax, ay)] }
			.filter { it.solverState != SolverState.REVEALED }
		var minX = board.width - 1
		var maxX = 0
		val minY = eSquare.y
		var maxY = 0
		adjacents.forEach {
			minX = min(it.x - 1, minX)
			maxX = max(it.x + 1, maxX)
			maxY = max(it.y + 1, maxY)
		}
		minX = max(0, minX)
		maxX = min(board.width - 1, maxX)
		maxY = min(board.height - 1, maxY)

		var x = eSquare.x + 1
		var y = minY
		while (y <= maxY) {
			while (x <= maxX) {
				if (squares[idx(x, y)].knowledgeState == KnowledgeState.EDGE) {
					val (overlap, onlyA) = adjacents.partition { abs(it.x - x) <= 1 && abs(it.y - y) <= 1 }
					val onlyB = board.adjacents(x, y)
						.map { (ax, ay) -> squares[idx(ax, ay)] }
						.filter { it.solverState != SolverState.REVEALED }
						.filterNot { abs(it.x - eSquare.x) <= 1 && abs(it.y - eSquare.y) <= 1 }
					if (diffSolvePair(eSquare, squares[idx(x, y)], onlyA, overlap, onlyB, pencil)) return true
				}
				++x
			}
			x = minX
			++y
		}
		return false
	}

	fun diffSolvePair(a : FrontSquare, b : FrontSquare, onlyA : List<FrontSquare>, overlap : List<FrontSquare>, onlyB : List<FrontSquare>, pencil : Boolean) : Boolean{
		if (overlap.all { it.knowledgeState != KnowledgeState.FRONT }) return false // would be solved by trivial solver
		val oaFlags = onlyA.count { it.solverState.isFlag(pencil) }
		val obFlags = onlyB.count { it.solverState.isFlag(pencil) }
		val oaSquares = onlyA.size
		val obSquares = onlyB.size
		val abDiff = board[a.x, a.y] - board[b.x, b.y]

		val trivialSolves = {am : Int, om : Int, bm : Int ->
			trivialSolveRegion(onlyA, am, pencil) || trivialSolveRegion(overlap, om, pencil) || trivialSolveRegion(onlyB, bm, pencil)
		}

		val lowerBoundOAMines = max(obFlags + abDiff, oaFlags)
		val lowerBoundOBMines = max(oaFlags - abDiff, obFlags)

		return if (min(obSquares + abDiff, oaSquares) == lowerBoundOAMines) {
			val overlappedMines = board[a.x, a.y] - lowerBoundOAMines
			val obMines = board[b.x, b.y] - overlappedMines

			trivialSolves(lowerBoundOAMines, overlappedMines, obMines)
		} else if (min(oaSquares - abDiff, obSquares) == lowerBoundOBMines) {
			val overlappedMines = board[b.x, b.y] - lowerBoundOBMines
			val oaMines = board[a.x, a.y] - overlappedMines

			trivialSolves(oaMines, overlappedMines, lowerBoundOBMines)
		} else false
	}

	fun flagSquare(x : Int, y : Int)  = flagSquare(idx(x, y))
	fun flagSquare(idx : Int) {
		if (!board.isMine(idx)) throw RuntimeException("attempted to flag non-mine square")
		val square = squares[idx]
		square.solverState = SolverState.FLAG
		numFlags += 1
		square.knowledgeState = KnowledgeState.SATISFIED
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

		square.knowledgeState = KnowledgeState.EDGE
		board.adjacents(x, y)
			.map { (ax, ay) -> squares[idx(ax, ay)] }
			.filter { it.knowledgeState == KnowledgeState.UNKNOWN }
			.forEach {
				numUnknown -= 1
				it.knowledgeState = KnowledgeState.FRONT
			}
		trivialSolveSquare(square)
	}

	fun pencilRevealSquare(idx : Int) {
		val square = squares[idx]
		square.solverState = SolverState.PENCIL_SAFE
	}
	fun pencilRevealSquare(x : Int, y : Int) = pencilRevealSquare(idx(x, y))

	fun bruteSolve() : Boolean {
		val minPencilFlags = if (totalMines - numFlags > numUnknown) {
			//must do full
			bruteSolveSegmentWrap(squares.filter { it.knowledgeState == KnowledgeState.FRONT }) ?: return true
		} else {
			segmentedBruteSolve() ?: return true
		}
		if (minPencilFlags + numFlags == totalMines && numUnknown > 0) {
			squares.forEach { if (it.knowledgeState == KnowledgeState.UNKNOWN) {
				--numUnknown
				revealSquare(it.x, it.y)
			} }
			return true
		}
		return false
	}

	fun bruteSolveSegmentWrap(front : List<FrontSquare>) : Int? {
		return if (front.size > 50) {
			//printFrontSegments()
			val (t, r) = time { bruteSolveSegment(front) }
			//println("large segment of size ${front.size} computed as $r in $t s")
			r
		} else bruteSolveSegment(front)
	}

	fun bruteSolveSegment(front : List<FrontSquare>) : Int? {
		var minPencilFlags : Int = front.count { it.mineShownPossible }
		for (i in front.indices) {
			val fSquare = front[i]
			if (fSquare.safeShownPossible && fSquare.mineShownPossible) {
				continue
			}
			fSquare.solverState = if (board.isMine(fSquare.x, fSquare.y)) SolverState.PENCIL_SAFE else {
				++numPencilFlags
				SolverState.PENCIL_FLAG
			}
			logicSolves(true)
			if (!feasable() || !bruteStep(front)) {
				front.forEach { it.resetPencil(board[it.x, it.y]) }
				numPencilFlags = 0
				if (board.isMine(fSquare.x, fSquare.y)) flagSquare(fSquare.x, fSquare.y) else revealSquare(fSquare.x, fSquare.y)
				return null
			} else {
				minPencilFlags = min(minPencilFlags, numPencilFlags)
				front.forEach { it.savePencil() }
				numPencilFlags = 0
			}
		}
		front.forEach { it.resetPencil(board[it.x, it.y]) }
		return minPencilFlags
	}

	fun bruteStep(front : List<FrontSquare>) : Boolean {
		for (i in front.indices) {
			if (front[i].solverState == SolverState.UNKNOWN) {

				if (front[i].safeShownPossible) pencilFlagSquare(front[i].x, front[i].y) else pencilRevealSquare(front[i].x, front[i].y)
				val unknownFront = front.filter { it.solverState == SolverState.UNKNOWN }
				logicSolves(true)
				if (!feasable() || !bruteStep(unknownFront)) {
					front[i].solverState = if (front[i].safeShownPossible) {
						numPencilFlags -= 1
						SolverState.PENCIL_SAFE
					} else {
						numPencilFlags += 1
						SolverState.PENCIL_FLAG
					}
					unknownFront.forEach {
						if (it.solverState.isFlag(true)) --numPencilFlags
						it.solverState = SolverState.UNKNOWN
					}
					if (!feasable() || !bruteStep(unknownFront)) {
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

	fun addFrontSquare(s : FrontSquare, l : ArrayList<FrontSquare>, markedSquares : BooleanArray) : ArrayList<FrontSquare> {
		if (markedSquares[idx(s.x, s.y)]) return l
		markedSquares[idx(s.x, s.y)] = true
		l += s
		board.adjacents(s.x, s.y).map { (ax, ay) -> squares[idx(ax, ay)] }
			.filter { it.knowledgeState == KnowledgeState.EDGE }
			.forEach { addEdgeSquare(it, l, markedSquares) }
		return l
	}

	fun addEdgeSquare(s : FrontSquare, l : ArrayList<FrontSquare>, markedSquares : BooleanArray) : ArrayList<FrontSquare> {
		if (markedSquares[idx(s.x, s.y)]) return l
		markedSquares[idx(s.x, s.y)] = true
		board.adjacents(s.x, s.y).map { (ax, ay) -> squares[idx(ax, ay)] }
			.filter { it.knowledgeState == KnowledgeState.FRONT }
			.forEach { addFrontSquare(it, l, markedSquares) }
		return l
	}

	fun getIsolatedSegments() : List<List<FrontSquare>> {
		val markedSquares = BooleanArray(squares.size) { false }

		val segments = ArrayList<ArrayList<FrontSquare>>()
		for (s in squares) {
			if (!markedSquares[idx(s.x, s.y)]) {
				when (s.knowledgeState) {
					KnowledgeState.EDGE -> segments += addEdgeSquare(s, ArrayList(), markedSquares)
					KnowledgeState.FRONT -> segments += addFrontSquare(s, ArrayList(), markedSquares)
					else -> {}
				}
			}
		}
		return segments
	}

	fun segmentedBruteSolve(segments : List<List<FrontSquare>> = getIsolatedSegments()) : Int? {
		return segments.sortedByDescending { it.size }.sumOf { bruteSolveSegmentWrap(it) ?: return null }
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

	fun printKnowledge() {
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
				char = when (squares[idx(x, y)].knowledgeState) {
					KnowledgeState.UNKNOWN -> ' '
					KnowledgeState.FRONT -> 'F'
					KnowledgeState.EDGE -> 'E'
					KnowledgeState.SATISFIED -> char
				}
				builder.append(char)
			}
			builder.append("|\n")
		}
		builder.append("-".repeat(board.width + 2))
		println(builder.toString())
	}

	fun printKnowledgeSimplified() {
		var satisfied = 0
		var edge = 0
		var front = 0
		var unknown = 0

		squares.forEach {
			when (it.knowledgeState) {
				KnowledgeState.SATISFIED -> ++satisfied
				KnowledgeState.EDGE -> ++edge
				KnowledgeState.FRONT -> ++front
				KnowledgeState.UNKNOWN -> ++unknown
			}
		}

		println("satisfied: $satisfied, edge: $edge, front: $front, unknown: $unknown")
	}

	fun printFrontSegments(segments : List<List<FrontSquare>> = getIsolatedSegments()) {

		val builder = StringBuilder()
		builder.append("${"-".repeat(board.width + 2)}\n")
		repeat(board.height) { y ->
			builder.append("|")
			repeat(board.width) {x ->
				var char = when(board[x, y]) {
					0.toByte() -> '-'
					9.toByte() -> 'X'
					else -> '-'
				}
				char = when (squares[idx(x, y)].solverState) {
					SolverState.FLAG -> 'F'
					SolverState.PENCIL_FLAG -> 'f'
					SolverState.PENCIL_SAFE -> 's'
					SolverState.REVEALED -> char
					else -> ' '
				}
				when (squares[idx(x, y)].knowledgeState) {
					KnowledgeState.EDGE -> char = 'e'
					else -> {}
				}
				for (segmentI in segments.indices) {
					if (segments[segmentI].any { it.x == x && it.y == y }) char = segmentI.digitToChar()
				}
				builder.append(char)
			}
			builder.append("|\n")
		}
		builder.append("-".repeat(board.width + 2))
		println(builder.toString())
	}

	private fun idx(x : Int, y : Int) = x + y * board.width
	fun xy(idx : Int) = Pair(idx % board.width, idx / board.width)

	companion object {

		fun generateBoard(width : Int, height : Int, mineCount : Int, r : KRandom = JRandom().asKotlinRandom()) : Pair<Board, Pair<Int, Int>> {
			val density = mineCount.toFloat() / (width * height).toFloat()
			return when {
				density >= 0.17 -> generateBoardMultithreaded(width, height, mineCount, r, 4)
				density >= 0.15 -> generateBoardMultithreaded(width, height, mineCount, r, 3)
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
	var knowledgeState = KnowledgeState.UNKNOWN

	var mineShownPossible = mineCount == 9.toByte()
	var safeShownPossible = mineCount < 9

	fun reveal() {
		solverState = SolverState.REVEALED
		knowledgeState = KnowledgeState.EDGE
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
		knowledgeState = KnowledgeState.UNKNOWN
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

enum class KnowledgeState {
	SATISFIED,
	EDGE,
	FRONT,
	UNKNOWN
}