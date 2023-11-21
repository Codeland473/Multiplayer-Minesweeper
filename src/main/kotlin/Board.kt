import kotlin.random.Random

class Board(var width : Int, var height : Int, var mineCounts : ByteArray = ByteArray(width * height)) {
	var startTime : Long = System.currentTimeMillis()

	fun currentTime() : Float = (System.currentTimeMillis() - startTime).toFloat() / 1000f
	fun resetTime() {
		startTime = System.currentTimeMillis()
	}

	fun clearBoard() {
		for (i in mineCounts.indices) mineCounts[i] = 0
	}

	fun generateBoard(mineCount : Int, noGuessing : Boolean) : Pair<Int, Int> {
		clearBoard()
		regenMines(mineCount)
		setMinecounts()
		if (noGuessing) {
			val solver = Solver(this)
			return solver.getSolvableBoard()
		} else {
			val minMineCounts = mineCounts.min()
			val possibleStarts = mineCounts.indices.filter { mineCounts[it] == minMineCounts }
			return if (possibleStarts.isEmpty()) {
				Pair(-1, -1)
			} else {
				val ret = possibleStarts.random()
				return Pair(ret % width, ret / width)
			}
		}
	}

	fun regenMines(mineCount : Int) {
		var loc = Random.nextInt(width * height)
		repeat(mineCount) {
			while (mineCounts[loc] == 9.toByte()) {
				loc = Random.nextInt(width * height)
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

	fun isRevealed(x : Int, y : Int, team : Team) : Boolean {
		if (!inBounds(x, y)) return true
		team.boardMask ?: return false
		return team.boardMask!![x + y * width]
	}

	fun isFlagged(x : Int, y : Int, team : Team, acceptPencils : Boolean = false) : Boolean {
		if (!inBounds(x, y)) return false
		team.flagStates ?: return false
		return if (acceptPencils) {
			team.flagStates!![x + y * width] != 0
		} else {
			team.flagStates!![x + y * width] > 0
		}
	}

	fun neighborFlags(x : Int, y : Int, team : Team, acceptPencils : Boolean = false) : Int {
		return adjacencyPairs.count { (dx, dy) ->
			isFlagged(x + dx, y + dy, team, acceptPencils)
		}
	}

	fun isSatisfied(x : Int, y : Int, team : Team, acceptPencils : Boolean = false) : Boolean {
		return neighborFlags(x, y, team, acceptPencils) == get(x, y).toInt()
	}

	fun neighborUnknowns(x : Int, y : Int, team : Team, acceptPencils : Boolean = false) : Int {
		return adjacencyPairs.count { (dx, dy) ->
			!isRevealed(x + dx, y + dy, team) && !isFlagged(x + dx, y + dy, team, acceptPencils)
		}
	}

	fun neighborUnflaggedMines(x : Int, y : Int, team : Team, acceptPencils : Boolean = false) : Int {
		return adjacencyPairs.count {(dx, dy) ->
			isMine(x + dx, y + dy) && !isFlagged(x + dx, y + dy, team, acceptPencils)
		}
	}

	fun revealSquare(x : Int, y : Int, team : Team) {
		if (team.boardMask == null) {
			team.boardMask = BooleanArray(width * height)
		}
		if (isRevealed(x, y, team)) {
			adjacencyPairs.forEach {(dx, dy) ->
				if (inBounds(x + dx, y + dy)) {
					team.boardMask!![x + dx + width * (y + dy)] = true
				}
			}
		} else {
			team.boardMask!![x + width * y] = true
		}
	}

	fun flagSquare(x : Int, y : Int, gamer : Gamer, team : Team, place : Boolean, isPencil : Boolean) {
		if (team.flagStates == null) {
			team.flagStates = IntArray(width * height) {0}
		}
		if (!place) {
			team.flagStates!![x + y * width] = 0
		} else {
			team.flagStates!![x + y * width] = if (isPencil) -gamer.id else gamer.id
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
	companion object {
		val adjacencyPairs = arrayOf(
			Pair(-1, -1), Pair(0, -1), Pair(1, -1),
			Pair(-1, 0), Pair(1, 0),
			Pair(-1, 1), Pair(0, 1), Pair(1, 1)
		)
	}
}