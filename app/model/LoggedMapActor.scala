package model

import play.libs.Akka
import akka.actor._
import play.api.libs.json._
import com.mohiva.play.silhouette.api.LoginInfo
import java.util.UUID

object LoggedMapActor {
  def props(out: ActorRef, masterServer: ActorRef, user: User) = Props(new LoggedMapActor(out, masterServer, user))
}

class LoggedMapActor(val out: ActorRef, var masterServer: ActorRef, var user: User) extends Actor {
  override def preStart() = {
    masterServer ! JoinChatMap(Some(user.userID))
  }
  
  override def postStop() = {
    masterServer ! LeaveChatMap(Some(user.userID))
  }
  
  def receive = {
   case msg: JsValue => {
       val t = (msg \ "type").as[String]
       println("Otrzymano " + msg);
       t match {
         case "AddNewRoom" => { 
           println("Przyszlo add new room w logged room");
           var lat = (msg \ "lat").as[Double];
           var lng = (msg \ "lng").as[Double];
           var title = (msg \ "title").as[String];
           masterServer ! AddNewRoom(title, lat, lng) 
         }
         
         case "AddFacebookFriend" => {
           println("Przyszlo AddFacebookFriend");
           var myFacebookID = (msg \ "userFacebookID").as[String];
           var friendFacebookID = (msg \ "friendFacebookID").as[String];
           masterServer ! AddFacebookFriend(myFacebookID, friendFacebookID); 
         }
       }
   }
   
   case RoomPacket(id: Int, title: String, lat: Double, lng: Double) =>
     implicit val RoomPacketFormat = Json.format[RoomPacket]
     out ! Json.obj("type" -> "AddedNewRoom", "id" -> id, "title" -> title, "lat" -> lat, "lng" -> lng)
     println("przyszedl room packet");
     
   case AddedFriend(friend: User, roomIDOption: Option[Int]) =>
     implicit val FriendPacketFormat = Json.format[FriendPacket]
     var friendPacket = FriendPacket(friend.userID.toString, (roomIDOption getOrElse "").toString, 
         friend.fullName getOrElse "", friend.avatarURL getOrElse "")
     out ! Json.obj("type" -> "NewFriend", "friend" -> friendPacket)   
     
   case NotifyFriendAboutMyNewRoom(userID: UUID, roomIDOption: Option[Int], nick: Option[String]) =>
     println("Friend changed room" + roomIDOption)
     //implicit val FriendChangedRoomPacketFormat = Json.format[FriendChangedRoomPacket]
     out ! Json.obj("type" -> "FriendChangedRoom", "friendID" -> userID.toString, "roomID" -> (roomIDOption getOrElse "").toString,
         "nick" -> (nick getOrElse "").toString)  

   case LoggedUserInfo(name: String, avatar: String, score: Int) =>
     out ! Json.obj("type" -> "LoggedUserInfo", "name" -> name, "avatar" -> avatar, "score" -> score)
  }
}