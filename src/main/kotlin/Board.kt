class Board(var mineCounts : ByteArray, var width : Int, var height : Int) {
	var startTime : Long = System.currentTimeMillis()

	fun currentTime() : Float = (System.currentTimeMillis() - startTime).toFloat() / 1000f

	operator fun get(x : Int, y : Int) : Byte {
		if (!inBounds(x, y)) return 0
		return mineCounts[x + y * width]
	}

	fun isMine(x : Int, y : Int) = get(x, y) == 9.toByte()

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

	fun inBounds(x : Int, y : Int) = x >= 0 && y >= 0 && x < width && y < width

	companion object {
		private val adjacencyPairs = arrayOf(
			Pair(-1, -1), Pair(0, -1), Pair(1, -1),
			Pair(-1, 0), Pair(1, 0),
			Pair(-1, 1), Pair(0, 1), Pair(1, 1)
		)
	}
}