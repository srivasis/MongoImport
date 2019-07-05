import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.Mongo;

public class Main {

	@SuppressWarnings({ "deprecation" })
	public static void main(String args[]) {

		if (args.length != 5) {
			System.out.println(
					"Incorrect arguments passed.\nArguments should be:\n1. Path to OneJira folder\n2. Path to the file containing start date\n3. IP address for the MongoDB\n4. Port number for MongoDB\n5. Database name");
			return;
		}

		String dir = args[0];
		String dateFile = args[1];
		String ip = args[2];
		int port = Integer.parseInt(args[3]);
		String dbName = args[4];
		
		System.out.println(
				"Arguments passed ->\n1. Path to OneJira folder: "+ dir +"\n2. Path to the file containing start date: "+ dateFile +"\n3. IP address for the MongoDB: "+ ip +"\n4. Port number for MongoDB: "+ port +"\n5. Database name: "+ dbName);

		FilePaths fps = new FilePaths(dir, dateFile);

		// filePaths -> Holds paths to all json files that need to be pulled into
		// MongoDB

		ArrayList<String> filePaths = fps.getFilePaths();

		try {
			Mongo mongo = new Mongo(ip, port);
			DB db = mongo.getDB(dbName);

			for (String filePath : filePaths) {
				String[] pathContents = filePath.split("\\\\");
				String projectID = pathContents[9];
				String fileName = pathContents[10];
				
				if(fileName.split("-")[2].equals("userstory")) {
					projectID+="Userstory";
				}

				System.out.println(filePath);
				
				DBCollection collection = db.getCollection(projectID);

				try {
					collection.insert((DBObject) JSON.parse(readFile(filePath)));
				} catch (Exception e) {
					System.out.println("Bad File Encountered -> " + filePath);
				}
			}

		} catch (Exception e) {
			System.out.println("Cannot insert into db");
			e.printStackTrace();
		}
	}

	@SuppressWarnings("resource")
	public static String readFile(String filepath) {
		InputStream is;
		try {
			is = new FileInputStream(filepath);
			BufferedReader buf = new BufferedReader(new InputStreamReader(is));
			String line = buf.readLine();
			StringBuilder sb = new StringBuilder();
			while (line != null) {
				sb.append(line).append("\n");
				line = buf.readLine();
			}
			String fileAsString = sb.toString();
			return fileAsString;
		} catch (FileNotFoundException e) {
			System.out.println("No file to read.");
			e.printStackTrace();
			return null;
		} catch (IOException e) {
			System.out.println("Nothing in file to read.");
			e.printStackTrace();
			return null;
		}
	}
}
