import board.Board
import board.Solver
import io.ktor.http.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.launch
import messages.*
import java.lang.Integer.min
import java.nio.ByteBuffer
import java.util.*
import kotlin.collections.LinkedHashSet
import kotlin.math.abs
import kotlin.math.max
import kotlin.random.Random

class SessionHandler {
	val gamers = Collections.synchronizedSet<Gamer>(LinkedHashSet())
	val teams = Collections.synchronizedSet<Team>(LinkedHashSet())
	val settings = Settings()
	var currentGameSettings : Settings? = null
	var board : Board? = null

	val currentSettings : Settings get() = currentGameSettings ?: settings
	init {
		CoroutineScope(Job()).launch {
			while (true) {
				delay((1000f / currentSettings.cursorUpdateRate.toFloat()).toLong())
				onCursorUpdateTick()
			}
		}
	}

	suspend fun onGamerJoin(sender : DefaultWebSocketServerSession, message : ByteBuffer) : Gamer {
		val requestedID = message.getInt()
		var team = message.getInt()
		val requestedColor = message.getColor()
		val hasLost = message.getBool()
		val name = message.getString()

		val givenID = if (requestedID <= 0 || gamers.any {it.id == requestedID && it.isConnected}) {
			var newID = Random.nextInt(1, Int.MAX_VALUE)
			while (gamers.any { it.id == newID}) {
				newID = Random.nextInt(1, Int.MAX_VALUE)
			}
			newID
		} else requestedID
		val color = if (requestedColor.r == 0.toByte() && requestedColor.g == 0.toByte() && requestedColor.b == 0.toByte())
			Color.random() else requestedColor
		if (!teams.any {it.id == team}) team = 0
		val gamer = Gamer(sender, givenID, color, name)
		gamer.team = team
		gamer.hasLost = hasLost

		gamers.removeIf { !it.isConnected && it.id == givenID }

		broadcast(Messages.gamerJoined(gamer))

		gamers += gamer
		gamer.connection.send(Messages.lobbyState(
			settings,
			gamers.toTypedArray(),
			teams.toTypedArray(),
			gamer,
			currentGameSettings,
			board
		))

		return gamer
	}

	suspend fun onStateRequest(sender : Gamer, message : ByteBuffer) {
		sender.connection.send(Messages.lobbyState(
			settings,
			gamers.toTypedArray(),
			teams.toTypedArray(),
			sender,
			currentGameSettings,
			board
		))
	}

	suspend fun onTeamCreateMessage(sender : Gamer, message : ByteBuffer) {
		val name = message.getString()
		val newTeam = Team(name)
		broadcast(Messages.teamCreate(newTeam.id, sender.id, newTeam.name))
		teams.add(newTeam)
	}
	suspend fun onTeamRemoveMessage(sender : Gamer, message : ByteBuffer) {
		val id = message.getInt()
		teams.removeIf {it.id == id}
		broadcast(Messages.teamRemove(id, sender.id))
		gamers.filter { it.team == id }.forEach { it.team = 0 }
	}
	suspend fun onGamerNameUpdateMessage(sender : Gamer, message : ByteBuffer) {
		val newName = message.getString()
		sender.name = newName
		broadcast(Messages.gamerNameUpdate(sender.id, newName))
	}
	suspend fun onGamerColorUpdateMessage(sender : Gamer, message : ByteBuffer) {
		val color = message.getColor()
		sender.color = color
		broadcast(Messages.gamerColorUpdate(sender.id, color))
	}
	suspend fun onGamerTeamUpdateMessage(sender : Gamer, message : ByteBuffer) {
		val targetTeam = message.getInt()
		if (teams.any { it.id == targetTeam } || targetTeam == 0) {
			sender.team = targetTeam
			broadcast(Messages.gamerTeamUpdate(sender.id, targetTeam))
		}
	}
	suspend fun onSettingUpdateMessage(sender : Gamer, message : ByteBuffer) {
		val settingID = message.getInt()
		when (settingID) {
			SETTING_UPDATE_RATE -> settings.cursorUpdateRate = message.getInt()
			SETTING_IS_NO_GUESSING -> settings.isNoGuessing = message.getBool()
			SETTING_IS_ALL_FOR_ONE -> settings.isAllForOne = message.getBool()
			SETTING_BOARD_SIZE -> {
				settings.boardWidth = message.getInt()
				settings.boardHeight = message.getInt()
			}
			SETTING_MINE_COUNT -> {
				settings.mineCount = min(message.getInt(), settings.boardWidth * settings.boardHeight - 1)
			}
			SETTING_COUNTDOWN_LENGTH -> settings.countdownLength = message.getInt()
		}
		broadcast(Messages.settingUpdate(settingID, sender.id, settings))
	}
	suspend fun onGameStartMessage(sender : Gamer, message : ByteBuffer) {
		currentGameSettings = settings.copy()
		teams.forEach {it.progress = TeamProgress(settings.boardWidth, settings.boardHeight)}
		if (settings.isNoGuessing) {
			val (newBoard, startPos) = Solver.generateBoard(settings.boardWidth, settings.boardHeight, settings.mineCount, settings.diffSolveRequirement, settings.bruteSolveRequirement)
			board = newBoard
			board!!.resetTime(settings)
			broadcast(Messages.gameStart(sender.id, startPos, currentSettings, board!!))
		} else {
			board = Board(settings.boardWidth, settings.boardHeight)
			val startPos = board!!.generateBoard(currentSettings.mineCount, currentSettings.isNoGuessing)
			board!!.resetTime(settings)
			broadcast(Messages.gameStart(sender.id, startPos, currentSettings, board!!))
		}
	}

	suspend fun onSquareRevealMessage(sender : Gamer, message : ByteBuffer) {
		val x = message.getInt()
		val y = message.getInt()
		val isChord = message.getBool()

		val team = teams.find { it.id == sender.team } ?: return
		if (sender.hasLost || team.hasLost) return
		board ?: return
		if (!board!!.inBounds(x, y)) return
		if (team.progress == null) team.progress = TeamProgress(board!!)

		if (board!!.isFlagged(x, y, team.progress!!)) return

		if (board!!.isRevealed(x, y, team.progress!!) != isChord) return
		var minRectX = board!!.width
		var maxRectX = 0
		var minRectY = board!!.height
		var maxRectY = 0

		val positions = ArrayList<Pair<Int, Int>>()

		val updateFun : (Int, Int) -> Unit = {mx, my ->
			minRectX = min(mx, minRectX)
			maxRectX = max(mx, maxRectX)
			minRectY = min(my, minRectY)
			maxRectY = max(my, maxRectY)
			positions.add(Pair(mx, my))
		}

		if (board!!.isRevealed(x, y, team.progress!!) && board!!.isSatisfied(x, y, team.progress!!)) {
			board!!.adjacents(x, y).forEach { (ax, ay) ->
				board!!.revealSquare(ax, ay, team.progress!!, updateFun)
			}
		} else {
			board!!.revealSquare(x, y, team.progress!!, updateFun)
		}

		val time = System.currentTimeMillis()

		if (positions.any { (x, y) -> board!!.isMine(x, y) }) onMineClicked(sender, team, time)

		if (team.hasLost) {
			for (pos in board!!.mineCounts.indices) {
				if (board!!.isMine(pos)) {
					updateFun(pos % board!!.width, pos / board!!.width)
				}
			}
		}
		if (positions.isEmpty()) return
		val rectWidth = maxRectX - minRectX + 1
		val rectHeight = maxRectY - minRectY + 1

		val diffRect = ByteArray(rectWidth * rectHeight) { 10 }

		positions.forEach { (modX, modY) -> diffRect[modX - minRectX + rectWidth * (modY - minRectY)] = board!![modX, modY] }

		broadcast(Messages.squareReveal(sender, minRectX, minRectY, rectWidth, rectHeight, diffRect, time)) {it.team == sender.team || it.team == 0}
		if (board!!.isCompleted(team.progress!!)) {
			team.hasFinished = true
			team.endTime = System.currentTimeMillis()
			broadcast(Messages.teamFinish(team, team.endTime!!))
			broadcast(Messages.boardStats(board!!.stats)) { it.team == team.id }
		} else if (team.hasLost) {
			broadcast(Messages.boardStats(board!!.stats)) { it.team == team.id }
		}
	}
	suspend fun onSquareFlagMessage(sender : Gamer, message : ByteBuffer) {
		val x = message.getInt()
		val y = message.getInt()
		val add = message.getBool()
		val isPencil = message.getBool()

		val team = teams.find { it.id == sender.team } ?: return
		if (sender.hasLost || team.hasLost) return
		board ?: return
		if (!board!!.inBounds(x, y)) return
		if (team.progress == null) team.progress = TeamProgress(board!!)
		if (board!!.isRevealed(x, y, team.progress!!)) return

		val time = System.currentTimeMillis()
		val idx = x + board!!.width * y
		if (!add && time - team.progress!!.flagTimes[idx] < settings.flagProtectionTime.toLong() &&
					abs(team.progress!!.flagStates[idx]) != sender.id) {
			sender.connection.send(Messages.squareFlag(abs(team.progress!!.flagStates[idx]), sender.team, x, y,
				true, team.progress!!.flagStates[idx] > 0))
			return
		}

		board!!.flagSquare(x, y, sender, team.progress!!, add, isPencil)

		broadcast(Messages.squareFlag(sender.id, sender.team, x, y, add, isPencil)) {it.team == sender.team || it.team == 0}
	}
	fun onCursorUpdateMessage(sender : Gamer, message : ByteBuffer) {
		sender.cursorLocation.x = message.getFloat()
		sender.cursorLocation.y = message.getFloat()
		sender.cursorUpdated = true
	}
	suspend fun onTeamNameUpdateMessage(sender : Gamer, message : ByteBuffer) {
		val teamID = message.getInt()
		val name = message.getString()
		val team = teams.find { it.id == teamID } ?: return
		team.name = name
		broadcast(Messages.teamNameUpdate(team.id, sender.id, name))
	}

	suspend fun onBoardClearMessage(sender : Gamer, message : ByteBuffer) {
		gamers.forEach {it.hasLost = false}
		teams.forEach { it.reset() }
		board = null
		gamers.removeIf { !it.isConnected }
		broadcast(Messages.boardClear(gamers.toTypedArray()))
	}

	suspend fun onGamerLeave(quitter : Gamer?) {
		quitter ?: return
		quitter.isConnected = false
		broadcast(Messages.gamerRemove(quitter))
	}

	suspend fun onCursorUpdateTick() {
		for (team in teams) {
			val updates = gamers.filter { it.cursorUpdated && it.team == team.id }
			if (updates.isEmpty()) continue
			broadcast(Messages.cursorUpdate(updates)) {it.team == team.id}
		}
	}

	//utils
	
	suspend fun broadcast(message : ByteArray, filter : (Gamer) -> Boolean = {true}) {
		for (gamer in gamers.filter { it.isConnected }.filter(filter)) {
			gamer.connection.send(message)
		}
	}

	suspend fun onMineClicked(gamer : Gamer, team : Team, time : Long) {
		gamer.hasLost = true
		val teamHasLost = currentSettings.isAllForOne || gamers.all { it.team != gamer.team || it.hasLost }
		if (teamHasLost) {
			team.hasLost = true
			team.endTime = time
			gamers.filter { it.team == team.id }.forEach { it.hasLost = true }
		}

		broadcast(Messages.gamerLost(gamer, teamHasLost, time)) {it.team != gamer.team && it.team != 0}
	}

	suspend fun onSettingsFormUpdate(parameters : Parameters) {
		for ((param, value) in parameters.entries()) {
			if (value.isEmpty()) continue
			if (value[0].isEmpty()) continue
			val v = value[0]
			when (param) {
				"board_width" -> {v.toIntOrNull()?.let { if (it >= 3) {
					settings.boardWidth = it
					if (gamers.size > 0) {
						broadcast(Messages.settingUpdate(SETTING_BOARD_SIZE, gamers.first().id, settings))
					}
				}}}
				"board_height" -> {v.toIntOrNull()?.let { if (it >= 3) {
					settings.boardHeight = it
					if (gamers.size > 0) {
						broadcast(Messages.settingUpdate(SETTING_BOARD_SIZE, gamers.first().id, settings))
					}
				}}}
				"mine_count" -> {v.toIntOrNull()?.let { if (it > 0) {
					settings.mineCount = it
					if (gamers.size > 0) {
						broadcast(Messages.settingUpdate(SETTING_MINE_COUNT, gamers.first().id, settings))
					}
				}}}
				"countdown_length" -> {v.toIntOrNull()?.let { if (it >= 0) {
					settings.countdownLength = it
					if (gamers.size > 0) {
						broadcast(Messages.settingUpdate(SETTING_COUNTDOWN_LENGTH, gamers.first().id, settings))
					}
				}}}
				"no_guessing" -> {
					val nv = v.lowercase().startsWith("t")
					settings.isNoGuessing = nv
					if (gamers.size > 0) {
						broadcast(Messages.settingUpdate(SETTING_IS_NO_GUESSING, gamers.first().id, settings))
					}
				}
				"all_for_one" -> {
					val nv = v.lowercase().startsWith("t")
					settings.isAllForOne = nv
					if (gamers.size > 0) {
						broadcast(Messages.settingUpdate(SETTING_IS_ALL_FOR_ONE, gamers.first().id, settings))
					}
				}
				"flag_protection_time" -> {v.toIntOrNull()?.let { if (it >= 0) settings.flagProtectionTime = it }}
				"diff_solve_requirement" -> {v.toIntOrNull()?.let { if (it >= 0) settings.diffSolveRequirement = it }}
				"brute_solve_requirement" -> {v.toIntOrNull()?.let { if (it >= 0) settings.bruteSolveRequirement = it }}
				"cursor_update_rate" -> {v.toIntOrNull()?.let { if (it > 0) {
					settings.cursorUpdateRate = it
					if (gamers.size > 0) {
						broadcast(Messages.settingUpdate(SETTING_UPDATE_RATE, gamers.first().id, settings))
					}
				}}}
			}
		}
	}
}