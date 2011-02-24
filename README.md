VanaTime
========

VanaTime is a JavaScript library that tracks FFXI game time. It was written by me (Rahskala/Bahamut) in mid-2010 for a never-finished Windows Sidebar gadget. I no longer play FFXI so I'm releasing this code into the public domain. It's only a *little* bit half-assed.

VanaDate
--------

Creating a `VanaDate` object will initialize it with the current date. You can pass in a JavaScript `Date` to initialize it to some other point in the past or future.

    var now = new VanaDate();
    var oneHourFromNow = new Date(/*etc*/);
	var vanaTimeInAnHour = new VanaDate(oneHourFromNow);

A `VanaDate` has the following properties:

### Date and time
* `year`
* `month` (0-11)
* `day` (0-29)
* `weekDay` (0-7) -- Vana'diel weeks have eight days
* `hour` (0-23)
* `minute` (0-59)
* `second` (0-59)
* `weekDayName` (string) -- Name of the day, i.e. "Earthsday"
* `earthDate` (`Date`) -- A JavaScript Date object of this instance's point in Earth time.
* `time` (integer) -- Raw number of Vana'diel seconds since midnight on 0001/01/01.

### Moon phases
* `moonPercent` (0-100) Percentage as shown on the in-game clock. 0 is New, 100 is Full.
* `moonPhase` (0-7) 
* `moonPhaseName` (string) -- Name of the moon phase
** 0: New Moon
** 1: Waxing Crescent
** 2: First Quarter Moon
** 3: Waxing Gibbous
** 4: Full Moon
** 5: Waning Gibbous
** 6: Last Quarter Moon
** 7: Waning Crescent

### Instance methods
* `start()` -- Returns the beginning of the Vana'diel day.
* `next()` -- Returns the next Vana'diel day.
* `previous()` -- Returns the previous Vana'diel day.

### Usage

	// Get the current Vana'diel time
	var now = new VanaDate(); // You can also pass in a JavaScript date object to 
                              // get the Vana'diel time for that point in time.
    console.log(now.weekDayName);      // "Firesday"
	var tomorrow = now.next();
	console.log(tomorrow.weekDayName); // "Earthsday"

Shop
----

The `Shop` class represents a guild shop with hours of operation and a weekly holiday. These include the nine crafting guilds plus the three Tenshodo shops. The `FFXI.shops` contains singleton objects for each shop:

* fishing
* woodworking
* smithing
* goldsmithing
* clothcraft
* leathercraft
* bonecraft
* alchemy
* cooking
* tenshodoj *(Jeuno)*
* tenshodob *(Bastok)*
* tenshodon *(Norg)*

### Methods

All of these methods act on the current Vana'diel time and take an optional `VanaTime` parameter to get info on a different time instead.

* `isOpen()` (boolean)
* `isHoliday()` (boolean)
* `nextOpen()` (`VanaDate`) -- The time the shop will next be open. 
* `nextClose()` (`VanaDate`) -- The time the shop will next close.

### Usage

	// Get info for the fishing guild shop
	var fishing = FFXI.shops.fishing;
	console.log(fishing.isOpen()); 		      // true
	console.log(fishing.isOpen(tomorrow));    // false
	console.log(fishing.isHoliday(tomorrow)); // true
	var opensAfterHolidayAt = fishing.nextOpen(tomorrow);

Route
-----
A `Route` represents a single leg of an airship or ferry trip. A route has three phases: Boarding, traveling, and inactive.

     |-------------------|-----------------|---------------|------------  etc...
    (1)    Boarding     (2)   Traveling   (3)   Inactive  (1)   Boarding

1. The ship arrives at the dock and players can get on.
2. The ship departs, leaving the dock.
3. The ship arrives at its destination.

Even though each of the 3 nations has a single *in-game airship* traveling between it and Jeuno, it is defined as two separate routes: One for each direction of travel.

**Note** I never bothered figuring out how many seconds airships spend in the boarding phase, so it's set to zero. Useful, eh?

`FFXI.routes` has the following trips defined:

#### Airships
* jeunoToBastok
* bastokToJeuno
* jeunoToWindurst
* windurstToJeuno
* jeunoToSandoria
* sandoriaToJeuno
* jeunoToKazham
* kazhamToJeuno
#### Manaclippers
* bibikiToPuronogo
* puronogoToBibiki
* reefTour
* rockTour
#### Ferries
These have identical schedules in both directions, so there's only one route for each path.

* selbinaMhaura
* alZahbiMhaura
* alZahbiNashmau

### Methods

As with `Shop`s, all of these methods act on the current Vana'diel time, and take an optional `VanaTime` parameter which makes them act on that time instead.

* `isBoarding()` (boolean)
* `nextBoarding()` (`VanaDate`) -- When the next boarding phase (1) starts.
* `nextDeparture()` (`VanaDate`) -- When the next traveling phase (2) starts.
* `nextPhase()` (`VanaDate`) -- The next boarding or traveling phase (1 or 2).

### Usage

	// What Earth time does the airship from Jeuno to Windurst leave?
    var leavesAt = FFXI.routes.jeunoToWindurst.nextDeparture();
	console.log(leavesAt.earthDate.toString());     // Thu Feb 24 2011 15:29:25 GMT-0600 (Central Standard Time)
	
	