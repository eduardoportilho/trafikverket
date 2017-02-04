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
Advertised                  | boolean   | Indicates whether the station advertised in the schedule
AdvertisedLocationName      | string    | The station name
AdvertisedShortLocationName | string    | The station's name in the short version
CountryCode                 | string    | Designation of the country in which the station is located. 'DE' - Germany, 'DK' - Denmark 'NO' - Norway, 'SE' - Sweden
CountyNo[]                  | int       | County code
Deleted                     | boolean   | Specifies that the data item has been deleted
Geometry.SWEREF99TM         | WKT       | Geometric point in the coordinate system SWEREF99TM
Geometry.WGS84              | WKT       | Geometric point in the coordinate system WGS84
LocationInformationText     | string    | Disclosure information for the station, for example. "SL trains are not covered." "Call 033-172444 for traffic"
LocationSignature           | string    | The station's unique signature, for example. "Cst"
ModifiedTime                | dateTime  | Time when the data record was changed
PlatformLine[]              | string    | The platform track
Prognosticated              | boolean   | Indicates whether the station forecast in schedule

### TrainAnnouncement

Timetable information, i.e. information about train traffic locations (stations, stops) each entry corresponds to a particular train at each junction.


Property                              | Type      | Description
--------------------------------------|-----------|---------------
ActivityId                            | string    | The event's unique ID
ActivityType                          | string    | "Arrival" or "Departure"
Advertised                            | boolean   | Specifies whether the arrival / departure advertised in the schedule
AdvertisedTimeAtLocation              | dateTime  | the timetable
AdvertisedTrainIdent                  | string    | Advertised train number (train number on the ticket)
Booking[]                             | string    | Booking information, for example: "Wagon 4 unbooked."
Canceled                              | boolean   | Specifies whether the arrival / departure is set
Deleted                               | boolean   | Specifies that the data item has been deleted
Deviation[]                           | string    | Any deviation, for example: "Bus Replacement," "Song Modified", "short train", "Not serving," etc.
EstimatedTimeAtLocation               | dateTime  | Date and time of the scheduled arrival or departure
EstimatedTimeIsPreliminary            | boolean   | Specifies whether a time estimate is preliminary. Note that if the estimated time is preliminary, it means that it can be changed in both forward and backward, a train can thus eg resign earlier than expected date if it also is marked as provisional.
FromLocation[].LocationName           | string    | Name of the station. Note that it refers to what is to be advertised for passengers, that is what should appear on signs, etc.. From Location can thus have different content for the same train at different stations and different content as arrivals and departures. Field specifies how the stations are announced.
FromLocation[].Priority               | int       | Priority for the stations to appear.
FromLocation[].Order                  | int       | The order in which stations are displayed.
InformationOwner                      | string    | Identification of traffic Owner
LocationSignature                     | string    | Signature of the station
MobileWebLink                         | string    | Url to the owner's mobile web traffic
ModifiedTime                          | dateTime  | Time when the data record was changed
NewEquipment                          | int       | The order of the train nyutrustats. If no new equipment has occurred, the value to be zero
OtherInformation[]                    | string    | Other advertising information, for example. "Bon voyage!", "Rear vehicle is locked!", "No boarding"
PlannedEstimatedTimeAtLocation        | dateTime  | Indicates a planned delay and its validity is indicated by PlannedEstimatedTimeAtLocationIsValid flag
PlannedEstimatedTimeAtLocationIsValid | boolean   | Specifies whether PlaneradBeraknadTid is valid. Will be set to false when an operational calculated timesheet, timesheet or slopningsrapport created
ProductInformation[]                  | string    | Description of the train, for example. "Tågkompaniet", "SJ intercity" "TiB / Tågkomp".
ScheduledDepartureDateTime            | dateTime  | The train's announced departure date
Service[]                             | string    | Little extras in addition to product information, eg "Bistro", "Sleeping and liggv"
TechnicalTrainIdent                   | string    | Technical train number
TimeAtLocation                        | dateTime  | When the train has arrived or departed
ToLocation[].LocationName             | string    | To the station for the train. Note that it refers to what is to be advertised for passengers, that is what should appear on signs, etc.. ToLocation can thus have different content for the same train at different stations and different content as arrivals and departures. Field specifies how the stations are announced.
ToLocation[].Priority                 | int       | Priority for the stations to appear.
ToLocation[].Order                    | int       | The order in which stations are displayed.
TrackAtLocation                       | string    | Track
TrainComposition[]                    | string    | Train composition, for example: "Carriage order 7, 6, 5, 4, 2, 1 '
TypeOfTraffic                         | string    | The traffic type, for example. "Train", "Direct Bus", "Extra Bus", "Compensation Bus", "Taxi".
ViaFromLocation[].LocationName        | string    | Name of the via from the station. Note that it refers to what is to be advertised for passengers, that is what should appear on signs, etc.. ViaFromLocation can thus have different content for the same train at different stations and different content as arrivals and departures. Field specifies how the stations are announced.
ViaFromLocation[].Priority            | int       | Priority for the stations to appear.
ViaFromLocation[].Order               | int       | The order in which stations are displayed.
ViaToLocation[].LocationName          | string    | Name of the we. Note that it refers to what is to be advertised for passengers, that is what should appear on signs, etc.. ViaToLocation can thus have different content for the same train at different stations and different content as arrivals and departures. Field specifies how the stations are announced.
ViaToLocation[].Priority              | int       | Priority for the stations to appear.
ViaToLocation[].Order                 | int       | The order in which stations are displayed.
WebLink                               | string    | Url to traffic the owner's website




