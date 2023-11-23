package messages

import Board
import Color
import Gamer
import SETTING_BOARD_SIZE
import SETTING_IS_ALL_FOR_ONE
import SETTING_IS_NO_GUESSING
import SETTING_MINE_COUNT
import SETTING_UPDATE_RATE
import Settings
import Team

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
			else -> {}
		}
	}

	fun gameStart(senderID : Int, startPos : Pair<Int, Int>, board : Board) = message(7) {
		put(senderID)
		put(startPos.first)
		put(startPos.second)
		put(board.mineCounts)
	}

	fun squareReveal(gamer : Gamer, posX : Int, posY : Int) = message(8) {
		put(gamer.id)
		put(gamer.team)
		put(posX)
		put(posY)
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
		for (team in teams) put(team.hasLost)
		if (board != null && currentSettings != null) {
			put(true)
			put(settings)
			put(board.currentTime())
			put(board.mineCounts)
			val gamersTeam = teams.find { it.id == newGamer.team }
			if (gamersTeam != null) {
				put(gamersTeam.boardMask ?: BooleanArray(board.width * board.height) {false})
				put(gamersTeam.flagStates ?: IntArray(board.width * board.height) {0})
			} else {
				for (team in teams) put(team.boardMask ?: BooleanArray(board.width * board.height) {false})
				for (team in teams) put(team.flagStates ?: IntArray(board.width * board.height) {0})
			}
		} else {
			put(false)
		}
	}

	fun gamerJoined(gamer : Gamer) = message(51) { put(gamer) }

	fun gamerRemove(quitter : Gamer?) = message(52) { put(quitter!!.id) }

	fun teamFinish(winner : Team) = message(53) { put(winner.id) }

	fun gamerLost(loser : Gamer) = message(54) { put(loser.id) }

	fun teamLost(loser : Gamer) = message(55) {
		put(loser.id)
		put(loser.team)
	}
}