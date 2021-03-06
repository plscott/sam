package edu.brown.cs.group.sam.metadata;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.xml.sax.ContentHandler;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;


public class MetadataReader {

  private static final String ALBUM_TAG = "xmpDM:album";
  private static final String ARTIST_TAG = "xmpDM:artist";
  private static final String TITLE_TAG = "dc:title";

  public static SongInfo getAudioMetadata(String audioFilePath) throws
      IOException, SAXException, TikaException {
    InputStream stream = new FileInputStream(new File(audioFilePath));
    ContentHandler handler = new DefaultHandler();
    Metadata metadata = new Metadata();

    AutoDetectParser parser = new AutoDetectParser();
    try {
      parser.parse(stream, handler, metadata);
    } finally {
      stream.close();
    }

    return new SongInfo(audioFilePath, metadata.get(TITLE_TAG),
        metadata.get(ALBUM_TAG), metadata.get(ARTIST_TAG));
  }

  public static SongInfo getAudioMetadata(File audioFile) throws
      IOException, SAXException, TikaException {
    return MetadataReader.getAudioMetadata(audioFile.getAbsolutePath());
  }
}
