package controllers

import play.api._
import play.api.mvc._
import play.api.Play.current
import model._
import play.api.libs.json._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.libs.Akka
import akka.actor._
import akka.pattern.ask
import akka.util.Timeout
import scala.concurrent.duration._
import model.Util.util._
import model.RoomPacket
import scala.concurrent.Future
import scala.collection.mutable.ListBuffer
import java.util.UUID
import scala.collection.mutable.HashMap
import play.api.libs.concurrent.Execution.Implicits._
import play.libs.Akka
import akka.actor._

import javax.inject.Inject

import com.mohiva.play.silhouette.api.{ Environment, LogoutEvent, Silhouette }
import com.mohiva.play.silhouette.impl.authenticators.CookieAuthenticator
import com.mohiva.play.silhouette.impl.providers.SocialProviderRegistry
import com.mohiva.play.silhouette.impl.daos.DelegableAuthInfoDAO
import com.mohiva.play.silhouette.impl.providers.OAuth2Info
import com.mohiva.play.silhouette.api.LoginInfo
import scala.collection.JavaConversions._
import com.mohiva.play.silhouette.api.repositories.AuthInfoRepository
import model.Daos.UserDAO

//import forms._
import model.User
import play.api.i18n.MessagesApi

import scala.concurrent.Future
import com.restfb.DefaultFacebookClient;
import com.restfb.FacebookClient;
import com.restfb.types.{User => UserFb}

class ApplicationController @Inject() (
  val messagesApi: MessagesApi,
  val userDao: UserDAO,
  val env: Environment[User, CookieAuthenticator],
  socialProviderRegistry: SocialProviderRegistry,
  authInfoRepository: AuthInfoRepository,
  val o2Dao: DelegableAuthInfoDAO[OAuth2Info])
  extends Silhouette[User, CookieAuthenticator] {
  
  val system = ActorSystem("MasterServerSystem", settings.systemActorConfig)
  val masterServer = system.actorOf (MasterServerActor.props(userDao), "MasterServerActor") 

  //def index = Action { implicit request =>
  //  Ok(views.html.index())
  //}

  
def roomsFacebook = SecuredAction.async { implicit request =>     
    o2Dao.find(request.identity.loginInfo) map { 
      resultInfo => resultInfo match  {
        case Some(authInfo) => 
          var accessToken = authInfo.accessToken 
          Ok(views.html.roomsFacebook(accessToken, request.identity.loginInfo.providerKey.toString()))
                  
        case None => NotFound(<h1>Page not found</h1>)
      }
    }
  }
  
  def index = UserAwareAction.async { implicit request =>
    request.identity match {
      case Some(user) => Future.successful(Redirect(routes.ApplicationController.roomsFacebook()))
      case None => Future.successful(Ok(views.html.index()))
    }
  }
  
  def signIn = Action.async { implicit request =>
     Future.successful(Ok(views.html.signIn(socialProviderRegistry)))
  }
  
  def game(idRoom: Int, nickOption: Option[String]) = UserAwareAction.async { implicit request =>
    println("przyszlo game idRoom: " + idRoom); 
    var nick = nickOption getOrElse ""
    implicit val timeout = Timeout(5 seconds)
    var resp = ask(masterServer, GiveServer(idRoom)).mapTo[(String, Int)] 
    resp map {(res) => println(res._1); 
      request.identity match {
        case Some(user) => println("Starting game with session " + user.userID.toString); Ok(views.html.game(res._1, res._2)).
        withSession("userID" -> user.userID.toString, "nick" -> nick); 
        case None => Ok(views.html.game(res._1, res._2)).withSession("nick" -> nick);
      }
    }
  }
  
  def roomsMap() = Action.async { implicit request =>
    Future.successful(Ok(views.html.roomsMap()))
  }
    
  //MOVE TO SERVER
 // def socketGame = WebSocket.acceptWithActor[JsValue, JsValue] {request => out =>
 //   println("socket game");
 //   PlayerActor.props(out, serverActor)
 // }
    
  def socketChatMap = WebSocket.acceptWithActor[JsValue, JsValue] {request => out =>
    MapActor.props(out, masterServer)
  }
  
  def socketLoggedChatMap = WebSocket.tryAcceptWithActor[JsValue, JsValue] { request => 
    implicit val req = Request(request, AnyContentAsEmpty)
    SecuredRequestHandler { securedRequest =>
      Future.successful(HandlerResult(Ok, Some(securedRequest.identity)))
    }.map {
      case HandlerResult(r, Some(user)) => Right(out => LoggedMapActor.props(out, masterServer, user))
      case HandlerResult(r, None) => Left(r)
    }
  }
  
  //def socketLoggedChatMap = WebSocket.acceptWithActor[JsValue, JsValue] { request => out =>
  //  LoggedChatMapActor.props(out, masterServer);
  //}
  /*
  def getRooms(): Future[List[RoomPacket]] = {
    implicit val timeout = Timeout(5 seconds)
    var resp = ask(masterServer, GiveRooms()).mapTo[List[RoomPacket]] 
    resp
  }
  
  def getFriends(userLoginInfo: LoginInfo): Future[List[User]] = {
    implicit val timeout = Timeout(5 seconds)
    var resp = ask(masterServer, GetFriends(userLoginInfo)).mapTo[List[User]]
    resp
  }
  
  def getUsersRooms(users: List[UUID]): Future[HashMap[UUID, Option[Int]]] = {
    implicit val timeout = Timeout(5 seconds)
    var resp = ask(masterServer, GetUsersRooms(users)).mapTo[HashMap[UUID, Option[Int]]]
    resp
  }
  */
  def logOut = SecuredAction.async { implicit request =>
   val result = Redirect(routes.ApplicationController.index()).withNewSession
   env.eventBus.publish(LogoutEvent(request.identity, request, request2Messages))

   env.authenticatorService.discard(request.authenticator, result)
  }
}
