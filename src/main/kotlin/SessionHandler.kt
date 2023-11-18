import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.flow
import messages.*
import java.lang.Integer.min
import java.nio.ByteBuffer
import java.util.*
import kotlin.collections.LinkedHashSet

class SessionHandler {
	var nextID = 1

	val gamers = Collections.synchronizedSet<Gamer>(LinkedHashSet())
	val teams = Collections.synchronizedSet<Team>(LinkedHashSet())
	val settings = Settings()
	var board : Board? = null

	init {
		flow {
			while (true) {
				delay((1000f / settings.cursorUpdateRate.toFloat()).toLong())
				emit(onCursorUpdateTick())
			}
		}
	}

	suspend fun onGamerJoin(sender : DefaultWebSocketServerSession, message : ByteBuffer) : Gamer {
		val requestedID = message.getInt()
		var team = message.getInt()
		val requestedColor = message.getColor()
		val name = message.getString()

		val givenID = if (requestedID <= 0 || gamers.any {it.id == requestedID}) ++nextID else requestedID
		val color = if (requestedColor.r == 0.toByte() && requestedColor.g == 0.toByte() && requestedColor.b == 0.toByte())
			Color.random() else requestedColor
		if (!teams.any {it.id == team}) team = 0
		val gamer = Gamer(sender, givenID, color, name)

		broadcast(GamerCreateMessage(gamer))

		UpdateNewGamerMessage(settings, gamers.toTypedArray(), teams.toTypedArray(), gamer, board).send(gamer)
		gamers += gamer

		return gamer
	}

	suspend fun onTeamCreateMessage(sender : Gamer, message : ByteBuffer) {
		val name = message.getString()
		val newTeam = Team(name)
		broadcast(TeamCreateMessage(newTeam.id, sender.id, newTeam.name))
		teams.add(newTeam)
	}
	suspend fun onTeamRemoveMessage(sender : Gamer, message : ByteBuffer) {
		val id = message.getInt()
		teams.removeIf {it.id == id}
		broadcast(TeamRemoveMessage(id, sender.id))
		gamers.filter { it.team == id }.forEach { it.team = 0 }
	}
	suspend fun onGamerNameUpdateMessage(sender : Gamer, message : ByteBuffer) {
		val newName = message.getString()
		sender.name = newName
		broadcast(GamerNameUpdateMessage(sender.id, newName))
	}
	suspend fun onGamerColorUpdateMessage(sender : Gamer, message : ByteBuffer) {
		val color = message.getColor()
		sender.color = color
		broadcast(GamerColorUpdateMessage(sender.id, color))
	}
	suspend fun onGamerTeamUpdateMessage(sender : Gamer, message : ByteBuffer) {
		val targetTeam = message.getInt()
		if (teams.any { it.id == targetTeam }) {
			sender.team = targetTeam
			broadcast(GamerTeamUpdateMessage(sender.id, targetTeam))
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
		}
		broadcast(SettingUpdateMessage(settingID, sender.id, settings))
	}
	suspend fun onGameStartMessage(sender : Gamer, message : ByteBuffer) {
		board = Board(settings.boardWidth, settings.boardHeight)
		val (startX, startY) = board!!.generateBoard(settings.mineCount, settings.isNoGuessing)
		broadcast(GameStartMessage(sender.id, startX, startY, board!!))
	}

	suspend fun onSquareRevealMessage(sender : Gamer, message : ByteBuffer) {
		val x = message.getInt()
		val y = message.getInt()

		val team = teams.find { it.id == sender.team } ?: return
		board ?: return
		if (!board!!.inBounds(x, y)) return
		if (board!!.isFlagged(x, y, team)) return

		if (board!![x, y] == 9.toByte() ||
			(board!!.isSatisfied(x, y, team)) &&
			board!!.isRevealed(x, y, team) &&
			board!!.neighborUnflaggedMines(x, y, team) > 0) {
			onMineClicked(sender, team)
		} else {
			board!!.revealSquare(x, y, team)
			broadcast(SquareRevealMessage(sender.id, x, y)) {it.team == sender.team || it.team == 0}
		}
	}
	suspend fun onSquareFlagMessage(sender : Gamer, message : ByteBuffer) {
		val x = message.getInt()
		val y = message.getInt()
		val add = message.getBool()
		val isPencil = message.getBool()

		val team = teams.find { it.id == sender.team } ?: return
		board ?: return
		if (!board!!.inBounds(x, y)) return

		board!!.flagSquare(x, y, sender, team, add, isPencil)

		broadcast(SquareFlagMessage(sender.id, x, y, add, isPencil)) {it.team == sender.team || it.team == 0}
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
		broadcast(TeamNameUpdateMessage(team.id, sender.id, name))
	}

	suspend fun onGamerLeave(quitter : Gamer?) {
		quitter ?: return
		gamers -= quitter
		broadcast(GamerRemoveMessage(quitter.id))
	}

	suspend fun onCursorUpdateTick() {
		for (team in teams) {
			val updates = gamers.filter { it.cursorUpdated && it.team == team.id }
			if (updates.isEmpty()) continue
			broadcast(CursorUpdateMessage(updates)) {it.team == team.id}
		}
	}

	//utils

	suspend fun broadcast(message : Message, filter : (Gamer) -> Boolean = {true}) {
		val messageData = message.toFrame()
		for (gamer in gamers.filter(filter)) {
			gamer.connection.send(messageData)
		}
	}

	suspend fun onMineClicked(gamer : Gamer, team : Team) {
		broadcast(GamerLostMessage(gamer.id))
		if (settings.isAllForOne || gamers.all { it.team != gamer.team || it.hasLost }) {
			broadcast(TeamLostMessage(gamer))
			team.hasLost = true
			gamers.filter { it.team == team.id }.forEach { it.hasLost = true }
		} else {
			broadcast(GamerLostMessage(gamer.id)) {it.team == gamer.team}
			gamer.hasLost = true
		}
	}
}