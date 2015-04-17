package edu.brown.cs.group.sam;

import java.util.Map;

import com.google.common.collect.ImmutableMap;
import com.google.gson.Gson;

import spark.ModelAndView;
import spark.Request;
import spark.Response;
import spark.Route;
import spark.Spark;
import spark.TemplateViewRoute;
import edu.brown.cs.group.sam.server.MusicServer;
import edu.brown.cs.group.sam.server.Server;
import edu.brown.cs.group.sam.sparkgui.SparkGui;

/**
 * Class that extends the basic implementation of
 * a spark graphical user interface.
 *
 * This handles the requests made by the front end for
 * back-end information.
 *
 * @author plscott
 *
 */
public class SamGui extends SparkGui {
  /* a GSON object for communicating with the GUI */
  private static final Gson GSON = new Gson();

  // instance variables declared
  private int port;
  private String serverAddress;
  private int serverPort;
  private Server server;

  public SamGui(int port, String address, int sPort) {
    this.port = port;
    this.serverAddress = address;
    this.serverPort = sPort;
  }

  /**
   * This method runs the spark server at the given port
   * and then sets up get and post requests.
   *
   * @param port The port number at which to run the
   * spark server
   */
  public void runSparkServer() {
    super.runSparkServer(port);

    // set up spark get requests to set up the pages
    Spark.get("/home", new HomeHandler(), super.getEngine());
    Spark.get("/server", new ServerHandler(), super.getEngine());
    Spark.get("/client", new ClientHandler(), super.getEngine());
    Spark.get("/songs", new SongsHandler(), super.getEngine());

    // set up post handlers for interactions with gui
    Spark.post("/startServer", new StartServerHandler());
  }

  /**
   * Class that models the response when the home page
   * is loaded on the front-end.
   *
   * @author plscott
   *
   */
  private class HomeHandler implements TemplateViewRoute {
    /**
     * Method that handles get requests from the home
     * page on the front-end.
     *
     * @param req the request
     * @param res the response
     */
    @Override
    public ModelAndView handle(Request req, Response res) {
      Map<String, Object> variables = new ImmutableMap.Builder<String, Object>()
          .build();

      return new ModelAndView(variables, "home.ftl");
    }
  }

  /**
   * Class that models the response when the server page
   * is loaded on the front-end.
   *
   * @author plscott
   *
   */
  private class ServerHandler implements TemplateViewRoute {
    /**
     * Method that handles get requests from the server
     * page on the front-end.
     *
     * @param req the request
     * @param res the response
     */
    @Override
    public ModelAndView handle(Request req, Response res) {
      Map<String, Object> variables = new ImmutableMap.Builder<String, Object>()
          .build();

      return new ModelAndView(variables, "server.ftl");
    }
  }

  /**
   * Class that models the response when the client page is
   * loaded on the front-end.
   *
   * @author plscott
   *
   */
  private class ClientHandler implements TemplateViewRoute {
    /**
     * Method that handles get requests from the client
     * page on the front-end.
     *
     * @param req the request
     * @param res the response
     */
    @Override
    public ModelAndView handle(Request req, Response res) {
      Map<String, Object> variables = new ImmutableMap.Builder<String, Object>()
          .build();

      return new ModelAndView(variables, "client.ftl");
    }
  }

  /**
   * Class that models the response when the songs page is
   * loaded on the front-end.
   *
   * @author plscott
   *
   */
  private class SongsHandler implements TemplateViewRoute {
    /**
     * Method that handles get requests from the songs
     * page on the front-end.
     *
     * @param req the request
     * @param res the response
     */
    @Override
    public ModelAndView handle(Request req, Response res) {
      Map<String, Object> variables = new ImmutableMap.Builder<String, Object>()
          .build();

      return new ModelAndView(variables, "songs.ftl");
    }
  }

  /**
   * Class that handles the gui request to start the
   * music server.
   *
   * @author plscott
   *
   */
  private class StartServerHandler implements Route {
    @Override
    public Object handle(Request req, Response res) {
      if (server == null) {
        server = new MusicServer(serverAddress, serverPort);
        server.run(); 
      }

      Map<String, Object> variables = new ImmutableMap.Builder<String, Object>()
          .build();

      return GSON.toJson(variables);
    }
  }

  public void shutdown() {
    server.close();
  }
}