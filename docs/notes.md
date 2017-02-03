# References

https://github.com/peterahlstrom/train-info-sweden
http://api.trafikinfo.trafikverket.se/Console
http://api.trafikinfo.trafikverket.se/API/


## Message model

### TrainMessage

Railway Traffic Message, such as information about the track work, tågfel, Plant fault and the like.

Property            | Type      | Description
--------------------|-----------|---------------
AffectedLocation[]  | string    | Affected interchanges (station signature)
CountyNo[]          | int       | county code
Deleted             | boolean   | Specifies that the data item has been deleted
EventId             | int       | The unique ID for the event
ExternalDescription | string    | information text
Geometry.SWEREF99TM | WKT       | Geometric point in the coordinate system SWEREF99TM
Geometry.WGS84      | WKT       | Geometric point in the coordinate system WGS84
LastUpdateDateTime  | dateTime  | Time when the message was updated
ModifiedTime        | dateTime  | Time when the data record was changed
ReasonCodeText      | string    | The possible cause
StartDateTime       | dateTime  | The start time

### TrainStation

Interchanges, both with and without passenger exchange.

Property                    | Type      | Description
----------------------------|-----------|---------------
Advertised                  | boolean   | Anger om stationen annonseras i tidtabell
AdvertisedLocationName      | string    | Stationens namn
AdvertisedShortLocationName | string    | Stationens namn i kort version
CountryCode                 | string    | Beteckning för i vilket land stationen finns. 'DE' - Tyskland, 'DK' - Danmark, 'NO' - Norge, 'SE' - Sverige
CountyNo[]                  | int       | Länsnummer
Deleted                     | boolean   | Anger att dataposten raderats
Geometry.SWEREF99TM         | WKT       | Geometrisk punkt i koordinatsystem SWEREF99TM
Geometry.WGS84              | WKT       | Geometrisk punkt i koordinatsystem WGS84
LocationInformationText     | string    | Upplysningsinformation för stationen, ex. "SL-tåg omfattas ej.", "Ring 033-172444 för trafikinformation"
LocationSignature           | string    | Stationens unika signatur, ex. "Cst"
ModifiedTime                | dateTime  | Tidpunkt då dataposten ändrades
PlatformLine[]              | string    | Plattformens spår
Prognosticated              | boolean   | Anger om stationen prognostiseras i tidtabell
