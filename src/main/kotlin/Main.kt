import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer
import java.lang.Exception
import java.net.InetSocketAddress

fun main() {
	val server = Server(4731)
	server.start()
}

class Server(port : Int) : WebSocketServer(InetSocketAddress(port)) {

	var openConnections = ArrayList<WebSocket>()

	override fun onOpen(conn : WebSocket, handshake : ClientHandshake) {
		openConnections.add(conn)
	}

	override fun onClose(conn : WebSocket, code : Int, reason : String?, remote : Boolean) {
		openConnections.remove(conn)
	}

	override fun onMessage(conn : WebSocket, message : String) {

	}

	override fun onError(conn : WebSocket, ex : Exception) {
		TODO("Not yet implemented")
	}

	override fun onStart() {
		TODO("Not yet implemented")
	}

}