package board

import Gamer
import Settings
import TeamProgress
import java.nio.ByteBuffer
import kotlin.math.ceil
import java.util.Random as JRandom
import kotlin.random.asKotlinRandom
import kotlin.random.Random as KRandom

class Board(var width : Int, var height : Int, var mineCounts : ByteArray = ByteArray(width * height)) {
	var startTime : Long = System.currentTimeMillis()
	var startPos : Pair<Int, Int>? = null

	fun currentTime() : Float = (System.currentTimeMillis() - startTime).toFloat() / 1000f
	fun resetTime(settings : Settings) {
		startTime = System.currentTimeMillis() + 1000L * settings.countdownLength
	}

	fun clearBoard() {
		for (i in mineCounts.indices) mineCounts[i] = 0
	}

	fun generateBoard(mineCount : Int, noGuessing : Boolean, r : KRandom = JRandom().asKotlinRandom()) : Pair<Int, Int> {
		clearBoard()
		regenMines(mineCount, r)
		setMinecounts()
		if (noGuessing) {
			val solver = Solver(this, r)
			startPos = solver.getSolvableBoard()
			return startPos!!
		} else {
			val minMineCounts = mineCounts.min()
			val possibleStarts = mineCounts.indices.filter { mineCounts[it] == minMineCounts }
			return if (possibleStarts.isEmpty()) {
				Pair(-1, -1)
			} else {
				val ret = possibleStarts.random(r)
				startPos = Pair(ret % width, ret / width)
				return startPos!!
			}
		}
	}

	fun regenMines(mineCount : Int, r : KRandom = JRandom().asKotlinRandom()) {
		var loc = r.nextInt(width * height)
		repeat(mineCount) {
			while (mineCounts[loc] == 9.toByte()) {
				loc = r.nextInt(width * height)
			}
			mineCounts[loc] = 9
		}
	}

	fun setMinecounts() {
		repeat(width) {x ->
			repeat(height) {y ->
				if (!isMine(x, y))
					mineCounts[x + y * width] = adjacents(x, y).count { (ax, ay) -> isMine(ax, ay) }.toByte()
			}
		}
	}

	operator fun get(x : Int, y : Int) : Byte {
		if (!inBounds(x, y)) return 0
		return mineCounts[x + y * width]
	}
	operator fun get(i : Int) = mineCounts[i]

	fun isMine(x : Int, y : Int) = get(x, y) == 9.toByte()
	fun isMine(idx : Int) = get(idx) == 9.toByte()

	fun isRevealed(x : Int, y : Int, team : TeamProgress) : Boolean {
		if (!inBounds(x, y)) return true
		return team.boardMask[x + y * width]
	}

	fun isFlagged(x : Int, y : Int, team : TeamProgress, acceptPencils : Boolean = false) : Boolean {
		if (!inBounds(x, y)) return false
		return if (acceptPencils) {
			team.flagStates[x + y * width] != 0
		} else {
			team.flagStates[x + y * width] > 0
		}
	}

	fun neighborFlags(x : Int, y : Int, team : TeamProgress, acceptPencils : Boolean = false) : Int {
		return adjacencyPairs.count { (dx, dy) ->
			isFlagged(x + dx, y + dy, team, acceptPencils)
		}
	}

	fun isSatisfied(x : Int, y : Int, team : TeamProgress, acceptPencils : Boolean = false) : Boolean {
		return neighborFlags(x, y, team, acceptPencils) == get(x, y).toInt()
	}

	fun neighborUnknowns(x : Int, y : Int, team : TeamProgress, acceptPencils : Boolean = false) : Int {
		return adjacencyPairs.count { (dx, dy) ->
			!isRevealed(x + dx, y + dy, team) && !isFlagged(x + dx, y + dy, team, acceptPencils)
		}
	}

	fun neighborUnflaggedMines(x : Int, y : Int, team : TeamProgress, acceptPencils : Boolean = false) : Int {
		return adjacencyPairs.count { (dx, dy) ->
			isMine(x + dx, y + dy) && !isFlagged(x + dx, y + dy, team, acceptPencils)
		}
	}

	fun revealSquare(x : Int, y : Int, team : TeamProgress, f : (Int, Int) -> Unit) {
		if (!isFlagged(x, y, team) && !isRevealed(x, y, team)) {
			team.boardMask[x + width * y] = true
			f(x, y)
			if (get(x, y) == 0.toByte()) {
				adjacents(x, y).forEach { (ax, ay) -> if (!isRevealed(ax, ay, team)) revealSquare(ax, ay, team, f) }
			}
		}
	}

	fun isCompleted(team : TeamProgress) : Boolean = team.boardMask.all { it }

	fun flagSquare(x : Int, y : Int, gamer : Gamer, team : TeamProgress, place : Boolean, isPencil : Boolean) {
		if (!place) {
			team.flagStates[x + y * width] = 0
		} else {
			team.flagStates[x + y * width] = if (isPencil) -gamer.id else gamer.id
		}
	}

	fun inBounds(x : Int, y : Int) = x >= 0 && y >= 0 && x < width && y < height

	fun adjacents(x : Int, y : Int) = adjacencyPairs
		.map { (dx, dy) ->  Pair(x + dx, y + dy)}
		.filter { (nx, ny) -> inBounds(nx, ny) }
	fun adjacents(i : Int) = adjacents(i % width, i / width)

	val coordinates : List<Pair<Int, Int>> get() = mineCounts.indices.map { Pair(it % width, it / width) }

	fun printableStr() : String {
		val builder = StringBuilder()
		builder.append("${"-".repeat(width + 2)}\n")
		repeat(height) { y ->
			builder.append("|")
			repeat(width) {x ->
				builder.append(when(get(x, y)) {
					0.toByte() -> " "
					9.toByte() -> "X"
					else -> get(x, y).toInt().toString()
				})
			}
			builder.append("|\n")
		}
		builder.append("-".repeat(width + 2))
		return builder.toString()
	}

	fun toBytesCompact(includeSize : Boolean = true) : ByteArray {
		val bytes = ByteBuffer.allocate(ceil(width * height.toFloat() / 8f + if (includeSize) 4 else 0).toInt())
		if (includeSize) {
			bytes.putShort(width.toShort())
			bytes.putShort(height.toShort())
		}
		var currentByte = 0
		for (i in mineCounts.indices) {
			if (isMine(i)) currentByte += 1 shl (i % 8)
			if (i % 8 == 7) {
				bytes.put(currentByte.toByte())
				currentByte = 0
			}
		}
		if (mineCounts.size % 8 != 0) {
			bytes.put(currentByte.toByte())
		}
		return bytes.array()
	}

	companion object {
		val adjacencyPairs = arrayOf(
			Pair(-1, -1), Pair(0, -1), Pair(1, -1),
			Pair(-1, 0), Pair(1, 0),
			Pair(-1, 1), Pair(0, 1), Pair(1, 1)
		)
	}
}