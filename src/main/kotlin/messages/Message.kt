package messages

import Board
import Color
import Gamer
import io.ktor.websocket.*
import putString
import putColor
import java.nio.ByteBuffer

interface Message {
	fun toFrame() : ByteArray
	suspend fun send(gamer : Gamer) {
		gamer.connection.send(toFrame())
	}
}

class TeamCreatedMessage(val teamID : Int, val creatorID : Int, val name : String) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(11 + name.length)
		buffer.put(1.toByte())
		buffer.putInt(teamID)
		buffer.putInt(creatorID)
		buffer.putString(name)
		return buffer.array()
	}
}

class TeamRemovedMessage(val teamID : Int, val removerID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(9)
		buffer.put(2.toByte())
		buffer.putInt(teamID)
		buffer.putInt(removerID)
		return buffer.array()
	}
}

class NameChangedMessage(val userID : Int, val newName : String) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(7 + newName.length)
		buffer.put(3.toByte())
		buffer.putInt(userID)
		buffer.putString(newName)
		return buffer.array()
	}
}


class UserColorChangedMessage(val userID : Int, val color : Color) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(8)
		buffer.put(4.toByte())
		buffer.putInt(userID)
		buffer.putColor(color)
		return buffer.array()
	}
}


class TeamJoinedMessage(val userID : Int, val teamID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(9)
		buffer.put(5.toByte())
		buffer.putInt(userID)
		buffer.putInt(teamID)
		return buffer.array()
	}
}

class SettingChangedMessage(val settingID : Int, val userID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(9)
		buffer.put(6.toByte())
		buffer.putInt(settingID)
		buffer.putInt(userID)
		TODO()
		return buffer.array()
	}
}

class GameStartMessage(val userID : Int, val startX : Int, val startY : Int, board : Board) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(9)
		buffer.put(7.toByte())
		TODO()
		return buffer.array()
	}
}


class SquareRevealedMessage(val userID : Int, val squareX : Int, val squareY : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(13)
		buffer.put(8.toByte())
		buffer.putInt(userID)
		buffer.putInt(squareX)
		buffer.putInt(squareY)
		return buffer.array()
	}
}


class SquareFlaggedMessage(val userID : Int, val squareX : Int, val squareY : Int, val isPlacing : Boolean, val isPencil : Boolean) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(15)
		buffer.put(9.toByte())
		buffer.putInt(userID)
		buffer.putInt(squareX)
		buffer.putInt(squareY)
		buffer.put(if (isPlacing) 1 else 0)
		buffer.put(if (isPencil) 1 else 0)
		return buffer.array()
	}
}


class CursorLocationsUpdateMessage(val gamers : Collection<Gamer>) : Message {
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


class UpdateNewPlayerMessage() : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(9)
		buffer.put(50.toByte())
		TODO()
		return buffer.array()
	}
}


class PlayerJoinedMessage(val userID : Int, val color : Color, val name : String) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(10 + name.length)
		buffer.put(51.toByte())
		buffer.putInt(userID)
		buffer.putColor(color)
		buffer.putString(name)
		return buffer.array()
	}
}


class PlayerLeftMessage(val userID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.put(52.toByte())
		buffer.putInt(userID)
		return buffer.array()
	}
}

class TeamFinishedMessage(val teamID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.put(53.toByte())
		buffer.putInt(teamID)
		return buffer.array()
	}
}


class PlayerLostMessage(val userID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.put(54.toByte())
		buffer.putInt(userID)
		return buffer.array()
	}
}


class TeamLostMessage(val userID : Int) : Message {
	override fun toFrame() : ByteArray {
		val buffer = ByteBuffer.allocate(5)
		buffer.put(55.toByte())
		buffer.putInt(userID)
		return buffer.array()
	}
}