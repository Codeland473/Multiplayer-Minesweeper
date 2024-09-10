package messages

import board.Board
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
import board.BoardStats

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
	}

	fun squareReveal(gamer : Gamer, minX : Int, maxX : Int, width : Int, height : Int, diffRect : ByteArray, time : Long) = message(8) {
		put(gamer.id)
		put(gamer.team)
		put(minX)
		put(maxX)
		put(width)
		put(height)
		put(diffRect)
		put(time)
	}

	fun squareFlag(gamerID : Int, teamID : Int, posX : Int, posY : Int, isPlacing : Boolean, isPencil : Boolean) = message(9) {
		put(gamerID)
		put(teamID)
		put(posX)
		put(posY)
		put(isPlacing)
		put(isPencil)
	}

	fun cursorUpdate(gamers : Collection<Gamer>) = message(10) {
		put(gamers.size)
		for (gamer in gamers) {
			put(gamer.id)
			put(gamer.cursorLocation)
		}
	}

	fun teamNameUpdate(teamID : Int, senderID : Int, name : String) = message(11) {
		put(teamID)
		put(senderID)
		put(name)
	}

	fun boardClear(gamers : Array<Gamer>) = message(12) {
		put(gamers.size)
		for (gamer in gamers) put(gamer)
	}

	fun lobbyState(
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
		for (gamer in gamers) put(gamer)
		for (team in teams) put(team)
		if (board != null && currentSettings != null) {
			put(true)
			put(settings)
			put(board.startTime)
			val (startX, startY) = board.startPos ?: Pair(-1, -1)
			put(startX)
			put(startY)
			val gamersTeam = teams.find { it.id == newGamer.team }
			if (gamersTeam != null) {
				if (gamersTeam.progress == null) gamersTeam.progress = TeamProgress(board)
				put(gamersTeam.progress!!, board)
			} else {
				for (team in teams) {
					if (team.progress == null) team.progress = TeamProgress(board)
					put(team.progress!!, board)
				}
				put(board.stats)
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

	fun gamerLost(loser : Gamer, teamLost : Boolean, time : Long) = message(54) {
		put(loser.id)
		put(if (teamLost) loser.team else 0)
		put(time)
	}

	fun boardStats(stats : BoardStats?) = message(55) {
		put(stats)
	}
}