package messages

import Board
import Color
import Gamer
import SETTING_BOARD_SIZE
import SETTING_COUNTDOWN_LENGTH
import SETTING_IS_ALL_FOR_ONE
import SETTING_IS_NO_GUESSING
import SETTING_MINE_COUNT
import SETTING_UPDATE_RATE
import Settings
import Team
import TeamProgress

object Messages {
	private val buffer = MessageBuffer()
	private fun<T> message(messageType : Int, f : MessageBuffer.() -> T) : ByteArray {
		buffer.put(messageType.toByte())
		buffer.f()
		val ret = buffer.coherentArray()
		buffer.reset()
		return ret
	}

	fun teamCreate(teamID : Int, creatorID : Int, name : String) = message(1) {
		put(teamID)
		put(creatorID)
		put(name)
	}

	fun teamRemove(teamID : Int, removerID : Int) = message(2) {
		put(teamID)
		put(removerID)
	}

	fun gamerNameUpdate(gamerID : Int, name : String) = message(3) {
		put(gamerID)
		put(name)
	}

	fun gamerColorUpdate(gamerID : Int, color : Color) = message(4) {
		put(gamerID)
		put(color)
	}

	fun gamerTeamUpdate(gamerID : Int, newTeam : Int) = message(5) {
		put(gamerID)
		put(newTeam)
	}

	fun settingUpdate(settingID : Int, gamerID : Int, settings : Settings) = message(6) {
		put(settingID)
		put(gamerID)
		when (settingID) {
			SETTING_UPDATE_RATE -> put(settings.cursorUpdateRate)
			SETTING_IS_NO_GUESSING -> put(settings.isNoGuessing)
			SETTING_IS_ALL_FOR_ONE -> put(settings.isAllForOne)
			SETTING_BOARD_SIZE -> {
				put(settings.boardWidth)
				put(settings.boardHeight)
			}
			SETTING_MINE_COUNT -> put(settings.mineCount)
			SETTING_COUNTDOWN_LENGTH -> put(settings.countdownLength)
			else -> {}
		}
	}

	fun gameStart(senderID : Int, startPos : Pair<Int, Int>, settings : Settings, board : Board) = message(7) {
		put(senderID)
		put(board.startTime)
		put(startPos.first)
		put(startPos.second)
		put(settings)
		put(board.mineCounts)
	}

	fun squareReveal(gamer : Gamer, posX : Int, posY : Int, isChord : Boolean) = message(8) {
		put(gamer.id)
		put(gamer.team)
		put(posX)
		put(posY)
		put(isChord)
	}

	fun squareFlag(gamer : Gamer, posX : Int, posY : Int, isPlacing : Boolean, isPencil : Boolean) = message(9) {
		put(gamer.id)
		put(gamer.team)
		put(posX)
		put(posY)
		put(isPlacing)
		put(isPencil)
	}

	fun cursorUpdate(gamers : Collection<Gamer>) = message(10) {
		put(gamers.size)
		for (gamer in gamers) put(gamer.cursorLocation)
	}

	fun teamNameUpdate(teamID : Int, senderID : Int, name : String) = message(11) {
		put(teamID)
		put(senderID)
		put(name)
	}

	fun boardClear() = message(12) {}

	fun updateNewGamer(
		settings : Settings,
	    gamers : Array<Gamer>,
	    teams : Array<Team>,
	    newGamer : Gamer,
	    currentSettings : Settings?,
	    board : Board?
	) = message(50) {
		put(settings)
		put(gamers.size)
		put(teams.size)
		put(newGamer.id)
		for (gamer in gamers) put(gamer.id)
		for (gamer in gamers) put(gamer.color)
		for (gamer in gamers) put(gamer.hasLost)
		for (gamer in gamers) put(gamer.name)
		for (gamer in gamers) put(gamer.team)
		for (gamer in gamers) put(gamer.cursorLocation)
		for (team in teams) put(team.id)
		if (board != null && currentSettings != null) {
			put(true)
			put(settings)
			put(board.startTime)
			val (startX, startY) = board.startPos ?: Pair(-1, -1)
			put(startX)
			put(startY)
			put(board.mineCounts)
			val gamersTeam = teams.find { it.id == newGamer.team }
			if (gamersTeam != null) {
				if (gamersTeam.progress == null) gamersTeam.progress = TeamProgress(board)
				put(gamersTeam.progress!!)
			} else {
				for (team in teams) {
					if (team.progress == null) team.progress = TeamProgress(board)
					put(team.progress!!)
				}
			}
		} else {
			put(false)
		}
	}

	fun gamerJoined(gamer : Gamer) = message(51) { put(gamer) }

	fun gamerRemove(quitter : Gamer?) = message(52) { put(quitter!!.id) }

	fun teamFinish(winner : Team, time : Long) = message(53) {
		put(winner.id)
		put(time)
	}

	fun gamerLost(loser : Gamer) = message(54) { put(loser.id) }

	fun teamLost(loser : Gamer, time : Long) = message(55) {
		put(loser.id)
		put(loser.team)
		put(time)
	}
}