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
import io.ktor.utils.io.core.*
import io.ktor.websocket.*
import io.netty.buffer.ByteBuf
import putBool
import putBoolArray
import putString
import putColor
import putIntArray
import java.nio.ByteBuffer
import java.nio.ByteOrder

interface Message {
	fun toFrame() : ByteArray
	suspend fun send(gamer : Gamer) {
		gamer.connection.send(toFrame())
	}


}

class MessageBuffer(private val initialMax : Int = 500) {
	private val internalBuffers = arrayListOf(ByteBuffer.allocate(initialMax))
	val buffer : ByteBuffer get() = internalBuffers.last()
	init { buffer.order(ByteOrder.BIG_ENDIAN) }

	private fun addBuffer() {
		internalBuffers.add(ByteBuffer.allocate(initialMax))
	}

	fun<T> putFun(size : Int, f : ByteBuffer.() -> T) {
		if (buffer.remaining() < size) addBuffer()
		buffer.f()
	}
	fun put(v : Byte) {
		if (buffer.remaining() < 1) addBuffer()
		buffer.put(v)
	}
	fun put(v : ByteArray) {
		if (v.size > buffer.remaining()) {
			val remaining = buffer.remaining()
			buffer.put(v.sliceArray(0 until remaining))
			addBuffer()
			put(v.sliceArray(remaining until v.size))
		} else {
			buffer.put(v)
		}
	}
	fun put(v : Int) = putFun(4) {putInt(v)}
	fun put(v : Float) = putFun(4) {putFloat(v)}
	fun put(v : Short) = putFun(4) {putShort(v)}
	fun put(v : Boolean) = put(if (v) 1 else 0)
	fun put(v : String) {
		val arr = v.toByteArray()
		put(arr.size.toShort())
		put(v.toByteArray())
	}
}

class TeamCreateMessage(val teamID : Int, val creatorID : Int, val name : String) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(11 + name.length)
		buffer.order(ByteOrder.BIG_ENDIAN)
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
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(2.toByte())
		buffer.putInt(teamID)
		buffer.putInt(removerID)
		return buffer.array()
	}
}

class GamerNameUpdateMessage(val gamerID : Int, val newName : String) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(7 + newName.length)
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(3.toByte())
		buffer.putInt(gamerID)
		buffer.putString(newName)
		return buffer.array()
	}
}


class GamerColorUpdateMessage(val gamerID : Int, val color : Color) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(8)
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(4.toByte())
		buffer.putInt(gamerID)
		buffer.putColor(color)
		return buffer.array()
	}
}


class GamerTeamUpdateMessage(val gamerID : Int, val teamID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(9)
		buffer.order(ByteOrder.BIG_ENDIAN)
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
		buffer.order(ByteOrder.BIG_ENDIAN)
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
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(7.toByte())
		buffer.putInt(gamerID)
		buffer.putInt(startX)
		buffer.putInt(startY)
		buffer.put(board.mineCounts)
		return buffer.array()
	}
}


class SquareRevealMessage(val gamer : Gamer, val squareX : Int, val squareY : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(17)
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(8.toByte())
		buffer.putInt(gamer.id)
		buffer.putInt(gamer.team)
		buffer.putInt(squareX)
		buffer.putInt(squareY)
		return buffer.array()
	}
}


class SquareFlagMessage(val gamer : Gamer, val squareX : Int, val squareY : Int, val isPlacing : Boolean, val isPencil : Boolean) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(19)
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(9.toByte())
		buffer.putInt(gamer.id)
		buffer.putInt(gamer.team)
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
		buffer.order(ByteOrder.BIG_ENDIAN)
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
		buffer.order(ByteOrder.BIG_ENDIAN)
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
	val currentSettings : Settings?,
	val board : Board?
	) : Message {
	override fun toFrame() : ByteArray {

		var size = 32 + 5 * teams.size + 20 * gamers.size
		size += teams.sumOf { 2 + it.name.length }
		size += gamers.sumOf { 2 + it.name.length }

		if (board != null) {
			size += 22 + board.width * board.height
			size += if (newGamer.team == 0) {
				5 * board.width * board.height
			} else {
				5 * board.width * board.height * teams.size
			}
		}

		val buffer = ByteBuffer.allocate(size)
		buffer.order(ByteOrder.BIG_ENDIAN)
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

		for (gamer in gamers) buffer.putInt(gamer.id)
		for (gamer in gamers) buffer.putColor(gamer.color)
		for (gamer in gamers) buffer.putBool(gamer.hasLost)
		for (gamer in gamers) buffer.putString(gamer.name)
		for (gamer in gamers) buffer.putInt(gamer.team)
		for (gamer in gamers) {
			buffer.putFloat(gamer.cursorLocation.x)
			buffer.putFloat(gamer.cursorLocation.y)
		}

		for (team in teams) buffer.putInt(team.id)
		for (team in teams) buffer.putBool(team.hasLost)
		for (team in teams) buffer.putString(team.name)

		if (board != null && currentSettings != null) {
			buffer.putBool(true)
			buffer.putInt(currentSettings.cursorUpdateRate)
			buffer.putBool(currentSettings.isNoGuessing)
			buffer.putBool(currentSettings.isAllForOne)
			buffer.putInt(currentSettings.boardWidth)
			buffer.putInt(currentSettings.boardHeight)
			buffer.putInt(currentSettings.mineCount)
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
			buffer.putBool(false)
		}

		return buffer.array()
	}
}


class GamerCreateMessage(val gamer : Gamer) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(15 + gamer.name.length)
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(51.toByte())
		buffer.putInt(gamer.id)
		buffer.putInt(gamer.team)
		buffer.putColor(gamer.color)
		buffer.putBool(gamer.hasLost)
		buffer.putString(gamer.name)
		return buffer.array()
	}
}


class GamerRemoveMessage(val gamerID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(52.toByte())
		buffer.putInt(gamerID)
		return buffer.array()
	}
}

class TeamFinishMessage(val teamID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(53.toByte())
		buffer.putInt(teamID)
		return buffer.array()
	}
}


class GamerLostMessage(val gamerID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(54.toByte())
		buffer.putInt(gamerID)
		return buffer.array()
	}
}


class TeamLostMessage(val loser : Gamer) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.order(ByteOrder.BIG_ENDIAN)
		buffer.put(55.toByte())
		buffer.putInt(loser.id)
		buffer.putInt(loser.team)
		return buffer.array()
	}
}