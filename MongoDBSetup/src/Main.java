import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.Mongo;
import com.mongodb.WriteConcern;

public class Main {

	@SuppressWarnings({ "deprecation" })
	public static void main(String args[]) {

		FilePaths fps = new FilePaths("\\\\TLPFILER\\sharpregr\\GAMIFI-SHARE\\DAT\\V01\\ONEJIRA",
				"C:\\MongoImport\\gamification\\MongoDBSetup\\src\\ReadFiles.txt");
		// filePaths -> Holds paths to all json files that need to be pulled into
		// MongoDB
		ArrayList<String> filePaths = fps.getFilePaths();
		HashMap<String, ArrayList<DBObject>> collectionToEntries = new HashMap<>();

		try {
			Mongo mongo = new Mongo("127.0.0.1", 27017);
			DB db = mongo.getDB("onejira");

			for (String filePath : filePaths) {
				String[] pathContents = filePath.split("\\\\");
				String projectID = pathContents[9];
				if (!collectionToEntries.containsKey(projectID)) {
					collectionToEntries.put(projectID, new ArrayList<>());
				}
				System.out.println(JSON.parse(readFile(filePath)));
				ArrayList<DBObject> listOfEntries = collectionToEntries.get(projectID);
				listOfEntries.add((DBObject) JSON.parse(readFile(filePath)));
				collectionToEntries.put(projectID, listOfEntries);
				
			}

			for (String projectID : collectionToEntries.keySet()) {
				DBCollection collection = db.getCollection(projectID);
				collection.insert(collectionToEntries.get(projectID), WriteConcern.NORMAL);
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
