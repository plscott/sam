package edu.brown.cs.group.sam.panAlgorithm;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import com.vividsolutions.jts.algorithm.ConvexHull;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.CoordinateSequence;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.MultiPoint;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.impl.CoordinateArraySequence;


public class AmplitudePanner {
	
	private ConvexHull convexHull;
	//rolloff = rolloff in sound per doubling of distance 
	private double rolloff;
	private static double distanceExp;
	private Map<String, ClientPoint> clients; 
	private Coordinate currentPoint;
	private Map<String, Double> currentWeighting;
		
	/**
	 * @param ms - MusicServer to request data from;
	 */
	public AmplitudePanner() {
		rolloff = 6.0;	//6.0 assumes a free field - sound not bounced back (louder this way)
		this.calculateDEXP();	
		clients = new HashMap<String, ClientPoint>();
	}
	/**
	 * Alternate constructor if default rolloff value not used.
	 * @param ms - MusicServer to request data from
	 * @param rolloff - specified rolloff value. 
	 */
	public AmplitudePanner(double rolloff) {
		
		if (rolloff < 0 || rolloff > 6) {
			System.out.println("ERROR: rolloff value must bet between 0 and 6");
			rolloff = 6.0;
		}
		clients = new HashMap<String, ClientPoint>();
		currentWeighting = new HashMap<String, Double>();
		this.rolloff = rolloff;
		this.calculateDEXP();
	}	
	/**
	 * Calculating exponent to raise Cartesian distance by when calculating relative volumes
	 */
	private void calculateDEXP() {
		distanceExp = rolloff / ((20.0)*Math.log10(2));		
	}
	/**
	 * @param clients the clients to set
	 */
	public Map<String, Double> setClients(ClientPoint[] clients) {	
		
		for (ClientPoint c: clients) {
			this.clients.put(c.getId(), c);
		}
		generateHull();
		return calcluteVolume(currentPoint);
	}
	
	public Map<String, Double> addClient(ClientPoint client) {
	  
	  if (!clients.containsValue(client)) {
	    clients.put(client.getId(), client);
        generateHull();
        return calcluteVolume(currentPoint);
	  }
	  return null;
	}
	
	public Map<String, Double> removeClient(ClientPoint client) {
		
		if (clients.remove(client.getId(), client)) {
			generateHull();
			return calcluteVolume(currentPoint);			
		}
		return null;
		
	}
	public void generateHull() {
		
		Coordinate[] coordinates = new Coordinate[clients.size()];
		Set<String> keys = clients.keySet();
		int i = 0;
		for (String key: keys) {
		    ClientPoint clientI = clients.get(key);
			coordinates[i] = clientI.getPoint().getCoordinate();
			i++;
		}				
		convexHull = new ConvexHull(coordinates, new GeometryFactory());
		
	}
	
	
	public double cartesianDist(Coordinate c1, Coordinate c2, double blur) {

		
		double xdiff = c1.x - c2.x;
		double ydiff = c1.y - c2.y;
	
		return Math.sqrt(Math.pow(xdiff, 2) + Math.pow(ydiff, 2) + Math.pow(blur, 2));		
	}	
	

	public Map<String, Double> calcluteVolume(Coordinate c1) {	
		
		if (c1!=null) {
			currentPoint = c1;
		}
		
		
		if (currentPoint==null || clients.size()==1) {
			Set<String> keys = clients.keySet();
			Map<String, Double> temp = new HashMap<String, Double>();
			for (String s: keys) {
				temp.put(s, 1.0);
			}
			currentWeighting = temp;
			return temp;
		}
		
		currentPoint = c1;
		Coordinate[] coord = new Coordinate[1];
		coord[0] = new Coordinate(c1.x, c1.y);
		CoordinateSequence seq = new CoordinateArraySequence(coord);
		Point p1 = new Point(seq, new GeometryFactory());
		
		double dist = 0;
		double fade = 1;
		
		if (!convexHull.getConvexHull().contains(p1)) {
			Coordinate cnew = placeWithinHull(p1, dist);
			double newDist = totalDistAway(cnew);
			
			double oldDist = totalDistAway(c1);
					
			fade = newDist/oldDist;
			c1 = cnew;
		}
		Map <String, Double> vol = new HashMap<String, Double>();
				
		for (String s: clients.keySet()) {
		   vol.put(s, getWeighting(clients.get(s).getPoint(), c1, dist)*fade);
		}
		currentWeighting = vol;
		return vol;
	}
	
	public double getWeighting(Point p1, Coordinate vs, double dist) {
		
		double weight = 0;
		
		double distPoint = cartesianDist(p1.getCoordinate(),
				vs, 0);		
		for (String s: clients.keySet()) {
			double di = cartesianDist(clients.get(s).getPoint().getCoordinate(),
					vs, 0);
			
			weight += Math.pow(distPoint, 2*distanceExp)/Math.pow(di, 2*distanceExp);			
		}
		return (1/weight);
	}
	public double totalDistAway(Coordinate coord) {
		
		double dist = 0;
		
		for (String s: clients.keySet()) {
			dist += cartesianDist(clients.get(s).getPoint().getCoordinate(), coord, 0);
		}		
		return dist;
	}
	
	
	public double calculateBlur() {
		return 0;
	}
	
	public Coordinate placeWithinHull(Point p1, double dist) {
		
		int pointN = convexHull.getConvexHull().getCoordinates().length;
		
		if (pointN <= 1) {
			return p1.getCoordinate();
		}		
		
		Coordinate[] coordinates = convexHull.getConvexHull().getCoordinates();		
		dist = Double.MAX_VALUE;
		MultiPoint closestLine = null;
		
		for (int i=0; i<pointN; i++) {
			Coordinate c = coordinates[i];
			System.out.println(i);;
			System.out.println(c.x);
			System.out.println(c.y);
		}
	
		Coordinate onHullCoord = null;
		for (int i=0; i<pointN; i++) {
			Coordinate c1 = coordinates[i];
			Coordinate c2 = coordinates[(i+1) % pointN];
			Coordinate[] linePoints = {c1, c2};
			MultiPoint line = new GeometryFactory().createMultiPoint(linePoints);
			Coordinate tempC = nearestPointOnLine(line, p1);
			double tempDist = cartesianDist(tempC, p1.getCoordinate(), 0);
			if (tempDist < dist) {
				dist = tempDist;
				onHullCoord = tempC;
			}			
		}
		return onHullCoord;
	}
	
	public static Coordinate nearestPointOnLine(MultiPoint line, Point p1) {
		
	    // http://stackoverflow.com/questions/1459368/snap-point-to-a-line-java
		
		Coordinate[] coord = line.getCoordinates();
		Coordinate a = coord[0];
		Coordinate b = coord[1];
		
        double apx = p1.getX() - a.x;
        double apy = p1.getY() - a.y;
        double abx = b.x - a.x;
        double aby = b.y - a.y;
	    double ab2 = abx * abx + aby * aby;
	    double ap_ab = apx * abx + apy * aby;
	    double t = Math.min(1, Math.max(ap_ab / ab2, 0));
	    
	    return new Coordinate(a.x+abx*t, a.y+aby*t);
	}
	public Map<String, ClientPoint> getClients() {
		return clients;
	}	
	public double getVolume(String id) {
	  return currentWeighting.get(id);
	}

}