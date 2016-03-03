package model

import akka.actor.ActorRef
import model.Util.Position
import java.util.UUID
import model.Util.util.RoomDescription
import com.mohiva.play.silhouette.api.LoginInfo

sealed abstract class ServerMessage
case class GetUniqueId ()  extends ServerMessage
case class Join (userID: Option[String])  extends ServerMessage
case class GiveMeUniqueId() extends ServerMessage
//case class UpdateData(id: Int, x: Double, y: Double, size: Double, R: Int, G: Int, B: Int, isSpiked: Boolean) extends ServerMessage
case class UpdateData(id: Int, x: Double, y: Double, size: Double, R: Int, G: Int, B: Int, eType: Int, name: String) extends ServerMessage
case class RemoveData(id: Int)
case class PlayerData(id: Int, x: Double, y: Double, size: Double, R: Int, G: Int, B: Int) extends ServerMessage
case class JoinRoom(idRoom: Int, userID: Option[String]) extends ServerMessage
case class GiveServer(idRoom: Int) extends ServerMessage
case class GiveRooms() extends ServerMessage
case class RoomPacket(id: Int, title: String, lat: Double, lng: Double) extends ServerMessage
case class FriendPacket(friendID: String, roomID: String, name: String, avatar: String) extends ServerMessage
case class JoinChatMap(userID: Option[UUID]) extends ServerMessage
case class AddNewRoom(title: String, lat: Double, lng: Double) extends ServerMessage
case class GetFriends(userLoginInfo: UUID) extends ServerMessage
case class AddedFriend(friend: User, roomID: Option[Int]) extends ServerMessage

case class AddFacebookFriend(myFacebookID: String, friendFacebookID: String) extends ServerMessage
case class NotifyFriendAboutMyNewRoom(userID: UUID, roomID: Option[Int], nick: Option[String]) extends ServerMessage
case class LeaveChatMap(userID: Option[UUID]) extends ServerMessage
case class FriendChangedRoomPacket(friendID: UUID, roomID: Int) extends ServerMessage
case class GetUsersRooms(users: List[UUID]) extends ServerMessage
case class AddedNewServerRoom(roomID: Int, roomDsc: RoomDescription) extends ServerMessage

//SERVER MESSAGES
case class AddNewServerRoom(roomID: Int) extends ServerMessage
case class AddNewServerRoomResponse(roomID: Option[Int]) extends ServerMessage
case class Leave(userID: Option[String]) extends ServerMessage
case class UserJoinedGame(userID: String, roomID: Int, nick: String) extends ServerMessage
case class UserLeftGame(userID: String) extends ServerMessage
case class RestartMyGame() extends ServerMessage
case class RestartGame(startPosition: Position) extends ServerMessage
case class SaveMyScore(score: Int, userID: String) extends ServerMessage
case class LoggedUserInfo(name: String, avatar: String, score: Int) extends ServerMessage

case class NodeActivated(address: String) extends ServerMessage
case class NodeActivatedConfirmation() extends ServerMessage

