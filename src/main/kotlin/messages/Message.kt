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
import io.ktor.websocket.*
import putBool
import putBoolArray
import putString
import putColor
import putIntArray
import java.nio.ByteBuffer

interface Message {
	fun toFrame() : ByteArray
	suspend fun send(gamer : Gamer) {
		gamer.connection.send(toFrame())
	}
}

class TeamCreateMessage(val teamID : Int, val creatorID : Int, val name : String) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(11 + name.length)
		buffer.put(1.toByte())
		buffer.putInt(teamID)
		buffer.putInt(creatorID)
		buffer.putString(name)
		return buffer.array()
	}
}

class TeamRemoveMessage(val teamID : Int, val removerID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(9)
		buffer.put(2.toByte())
		buffer.putInt(teamID)
		buffer.putInt(removerID)
		return buffer.array()
	}
}

class GamerNameUpdateMessage(val gamerID : Int, val newName : String) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(7 + newName.length)
		buffer.put(3.toByte())
		buffer.putInt(gamerID)
		buffer.putString(newName)
		return buffer.array()
	}
}


class GamerColorUpdateMessage(val gamerID : Int, val color : Color) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(8)
		buffer.put(4.toByte())
		buffer.putInt(gamerID)
		buffer.putColor(color)
		return buffer.array()
	}
}


class GamerTeamUpdateMessage(val gamerID : Int, val teamID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(9)
		buffer.put(5.toByte())
		buffer.putInt(gamerID)
		buffer.putInt(teamID)
		return buffer.array()
	}
}

class SettingUpdateMessage(val settingID : Int, val gamerID : Int, val settings : Settings) : Message {
	override fun toFrame() : ByteArray {
		val size = when (settingID) {
			SETTING_UPDATE_RATE -> 4
			SETTING_IS_NO_GUESSING -> 1
			SETTING_IS_ALL_FOR_ONE -> 1
			SETTING_BOARD_SIZE -> 8
			SETTING_MINE_COUNT -> 4
			else -> throw RuntimeException("invalid setting")
		} + 9
		val buffer = ByteBuffer.allocate(size)
		buffer.put(6.toByte())
		buffer.putInt(settingID)
		buffer.putInt(gamerID)
		when (settingID) {
			SETTING_UPDATE_RATE -> buffer.putInt(settings.cursorUpdateRate)
			SETTING_IS_NO_GUESSING -> buffer.putBool(settings.isNoGuessing)
			SETTING_IS_ALL_FOR_ONE -> buffer.putBool(settings.isAllForOne)
			SETTING_BOARD_SIZE -> {
				buffer.putInt(settings.boardWidth)
				buffer.putInt(settings.boardHeight)
			}
			SETTING_MINE_COUNT -> buffer.putInt(settings.mineCount)
		}
		return buffer.array()
	}
}

class GameStartMessage(val gamerID : Int, val startX : Int, val startY : Int, val board : Board) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(9)
		buffer.put(7.toByte())
		buffer.putInt(gamerID)
		buffer.putInt(startX)
		buffer.putInt(startY)
		buffer.put(board.mineCounts)
		return buffer.array()
	}
}


class SquareRevealMessage(val gamerID : Int, val squareX : Int, val squareY : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(13)
		buffer.put(8.toByte())
		buffer.putInt(gamerID)
		buffer.putInt(squareX)
		buffer.putInt(squareY)
		return buffer.array()
	}
}


class SquareFlagMessage(val gamerID : Int, val squareX : Int, val squareY : Int, val isPlacing : Boolean, val isPencil : Boolean) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(15)
		buffer.put(9.toByte())
		buffer.putInt(gamerID)
		buffer.putInt(squareX)
		buffer.putInt(squareY)
		buffer.putBool(isPlacing)
		buffer.putBool(isPencil)
		return buffer.array()
	}
}

class CursorUpdateMessage(val gamers : Collection<Gamer>) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5 + 12 * gamers.size)
		buffer.put(10.toByte())
		buffer.putInt(gamers.size)
		for (gamer in gamers) {
			buffer.putInt(gamer.id)
			buffer.putFloat(gamer.cursorLocation.x)
			buffer.putFloat(gamer.cursorLocation.y)
		}
		return buffer.array()
	}
}

class TeamNameUpdateMessage(val teamID : Int, val senderID : Int, val teamName : String) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(11 + teamName.length)
		buffer.put(11.toByte())
		buffer.putInt(teamID)
		buffer.putInt(senderID)
		buffer.putString(teamName)
		return buffer.array()
	}
}

class UpdateNewGamerMessage(
	val settings : Settings,
	val gamers : Array<Gamer>,
	val teams : Array<Team>,
	val newGamer : Gamer,
	val board : Board?
	) : Message {
	override fun toFrame() : ByteArray {

		var size = 32 + 8 * teams.size + 11 * gamers.size
		size += teams.sumOf { 2 + it.name.length }
		size += gamers.sumOf { 2 + it.name.length }

		if (board != null) {
			size += 4 + board.width * board.height
			size += if (newGamer.team == 0) {
				5 * board.width * board.height
			} else {
				5 * board.width * board.height * teams.size
			}
		}

		val buffer = ByteBuffer.allocate(size)
		buffer.put(50.toByte())

		buffer.putInt(settings.cursorUpdateRate)
		buffer.putBool(settings.isNoGuessing)
		buffer.putBool(settings.isAllForOne)
		buffer.putInt(settings.boardWidth)
		buffer.putInt(settings.boardHeight)
		buffer.putInt(settings.mineCount)
		buffer.putInt(gamers.size)
		buffer.putInt(teams.size)
		buffer.putInt(newGamer.id)

		for (team in teams) buffer.putInt(team.id)
		for (gamer in gamers) buffer.putInt(gamer.id)
		for (gamer in gamers) buffer.putColor(gamer.color)
		for (gamer in gamers) buffer.putInt(gamer.team)
		for (team in teams) buffer.putString(team.name)
		for (gamer in gamers) buffer.putString(gamer.name)

		if (board != null) {
			buffer.putInt(1)
			buffer.putFloat(board.currentTime())
			buffer.put(board.mineCounts)
			val gamersTeam = teams.find { it.id == newGamer.id }
			if (gamersTeam == null) {
				for (team in teams) buffer.putBoolArray(team.boardMask ?: BooleanArray(board.width * board.height) {false})
				for (team in teams) buffer.putIntArray(team.flagStates ?: IntArray(board.width * board.height) {0})
			} else {
				buffer.putBoolArray(gamersTeam.boardMask ?: BooleanArray(board.width * board.height) {false})
				buffer.putIntArray(gamersTeam.flagStates ?: IntArray(board.width * board.height) {0})
			}
		} else {
			buffer.putInt(0)
		}

		return buffer.array()
	}
}


class GamerCreateMessage(val gamer : Gamer) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(14 + gamer.name.length)
		buffer.put(51.toByte())
		buffer.putInt(gamer.id)
		buffer.putInt(gamer.team)
		buffer.putColor(gamer.color)
		buffer.putString(gamer.name)
		return buffer.array()
	}
}


class GamerRemoveMessage(val gamerID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.put(52.toByte())
		buffer.putInt(gamerID)
		return buffer.array()
	}
}

class TeamFinishMessage(val teamID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.put(53.toByte())
		buffer.putInt(teamID)
		return buffer.array()
	}
}


class GamerLostMessage(val gamerID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.put(54.toByte())
		buffer.putInt(gamerID)
		return buffer.array()
	}
}


class TeamLostMessage(val loser : Gamer) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.put(55.toByte())
		buffer.putInt(loser.id)
		buffer.putInt(loser.team)
		return buffer.array()
	}
}