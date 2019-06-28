import java.util.ArrayList;
import java.util.HashSet;

import org.bson.Document;

import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.CreateCollectionOptions;
import com.mongodb.util.JSON;

public class Main {

	@SuppressWarnings({ "unused", "resource" })
	public static void main(String args[]) {
		
		FilePaths fps = new FilePaths("\\\\TLPFILER\\sharpregr\\GAMIFI-SHARE\\DAT\\V01\\ONEJIRA", "C:\\MongoImport\\MongoDBSetup\\src\\ReadFiles.txt");
		// filePaths -> Holds paths to all json files that need to be pulled into
		// MongoDB
		ArrayList<String> filePaths = fps.getFilePaths();
		HashSet<String> collections = new HashSet<>();		
		MongoClient mongoClient = new MongoClient("localhost", 27017);
		MongoDatabase database = mongoClient.getDatabase("onejira");
		
		for (String name : database.listCollectionNames()) {
		    collections.add(name);
		}
		
		for(String filePath : filePaths) {
			String[] pathContents = filePath.split("\\\\");
			
			String date = pathContents[8];
			String projectID = pathContents[9];
			String jsonFile = pathContents[10];
			
			if(!collections.contains(projectID)) {
				database.createCollection(projectID);//, new CreateCollectionOptions().capped(true).sizeInBytes(0x100000));
				collections.add(projectID);
				//MongoCollection<Document> collection = database.getCollection(projectID);
				//collection.insertOne(JSON.parse(new Document());
			}
		}
	}
}
