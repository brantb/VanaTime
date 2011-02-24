// VanaTime.js: A JavaScript library for Final Fantasy XI timekeeping.

(function (window) {
    ////////////////
    // Constants
    // Earth time     : 2002/06/23 16:00 GMT
    // Vana'diel time : 0898/02/01 00:00
    var VANA_BIRTH = new Date();
    VANA_BIRTH.setUTCFullYear(2002, 5, 23);
    VANA_BIRTH.setUTCHours(15, 0, 0, 0);
    var VANA_SECS_SINCE_YEAR_0 = (((898 * 360) + 30) * 24 * 60 * 60);
    var EARTH_TIME_YEAR_0 = new Date(VANA_BIRTH.getTime() - (VANA_SECS_SINCE_YEAR_0 * 1000) / 25);

    var VANA_SECS_PER_YEAR = 360 * 24 * 60 * 60;  // 360 days per year
    var VANA_SECS_PER_MONTH = 30 * 24 * 60 * 60;  // 30 days per month
    var VANA_SECS_PER_WEEK = 8 * 24 * 60 * 60;    // Eight Days a Week
    var VANA_SECS_PER_DAY = 24 * 60 * 60;         // 24 hours per day
    var VANA_SECS_PER_HOUR = 60 * 60;             // 60 minutes per hour

    ////////////////////
    // Utility functions
    function getSecs(hours, minutes) {
        return (hours * VANA_SECS_PER_HOUR) + (minutes * 60);
    }
    // makeClass - By John Resig (MIT Licensed)
    function makeClass() {
        return function (args) {
            if (this instanceof arguments.callee) {
                if (typeof this.init == "function")
                    this.init.apply(this, (args && args.callee) ? args : arguments);
            } else
                return new arguments.callee(arguments);
        };
    }

    /////////////////////////////////////////////////////////////////////////////
    // FFXI Class
    // Singleton with arrays containing shops, routes, translatable strings, etc.
    var FFXI = makeClass();
    FFXI.prototype.init = function () {
        ///////////////////////
        // Translatable strings
        var _translations = {
            guilds: ["Fishing", "Woodworking", "Smithing", "Goldsmithing", "Clothcraft",
                    "Leathercraft", "Bonecraft", "Alchemy", "Cooking",
                    "Tenshodo (Jeuno)", "Tenshodo (Bastok)", "Tenshodo (Norg)"],
            routes: ["Jeuno-Bastok", "Bastok-Jeuno", "Jeuno-Windurst", "Windurst-Jeuno",
                     "Jeuno-San d'Oria", "San d'Oria-Jeuno", "Jeuno-Kazham", "Kazham-Jeuno",
                     "Selbina-Mhaura", "Al Zahbi-Mhaura", "Al Zahbi-Nashmau",
                     "Bibiki-Puronogo", "Puronogo-Bibiki",
                     "Maliyakaleya Reef Tour", "Dhalmel Rock Tour"]
        };

        //////////////
        // Shop class
        // Represents a shop with hours of operation and a weekly holiday.
        // nextOpen(), et al assume a shop is always closed at 00:00 and
        // 23:59, which is currently true for all of them.
        var Shop = makeClass();
        Shop.prototype = {
            init: function (id, holiday, open, close) {
                this.name = _translations.guilds[id];
                this.holiday = holiday;
                this.open = open;
                this.close = close;
            },
            isOpen: function (vanaDate) {
                if (typeof (vanaDate) == 'undefined') {
                    vanaDate = new VanaDate();
                }
                var time = getSecs(vanaDate.hour, vanaDate.minute);
                return (!this.isHoliday(vanaDate)
                        && getSecs(this.open, 0) <= time
                        && getSecs(this.close, 0) > time);
            },
            isHoliday: function (vanaDate) {
                if (typeof (vanaDate) == 'undefined') {
                    vanaDate = new VanaDate();
                }
                return (this.holiday == vanaDate.weekDay);
            },
            nextOpen: function (vanaDate) {
                if (typeof (vanaDate) == 'undefined') {
                    vanaDate = new VanaDate();
                }
                var nextOpen;
                var time = getSecs(vanaDate.hour, vanaDate.minute);
                var openAt = getSecs(this.open, 0);
                //var closeAt = getSecs(this.close, 0);

                if (time < openAt) {
                    nextOpen = vanaDate.start().time + openAt
                } else {
                    nextOpen = vanaDate.next().start().time + openAt;
                }

                return new VanaDate(nextOpen);
            },
            nextClose: function (vanaDate) {
                if (typeof (vanaDate) == 'undefined') {
                    vanaDate = new VanaDate();
                }
                var nextClose;
                var time = getSecs(vanaDate.hour, vanaDate.minute);
                var closeAt = (getSecs(this.close, 0));
                if (time < closeAt) {
                    nextClose = vanaDate.start().time + closeAt;
                } else {
                    nextClose = vanaDate.next().start().time + closeAt;
                }
                return new VanaDate(nextClose);
            }
        }
        //////////////
        // Route class
        // Represents a one-directional route between two destinations via airship or boat.
        // Times are measured in Vana'diel seconds.
        // A route has 3 phases: Boarding, traveling, and inactive.
        // Cycle measures Vana'diel seconds between boardings.
        // Boarding begins at midnight+offset.
        var Route = makeClass();
        Route.prototype = {
            init: function (id, boarding, travel, cycle, offset) {
                this.name = _translations.routes[id];
                this.boarding = boarding;
                this.travel = travel;
                this.cycle = cycle;
                this.offset = offset;
            },
            nextBoarding: function (vanaDate) {
                if (typeof (vanaDate) == 'undefined') {
                    vanaDate = new VanaDate();
                }

                // get the first boarding of the day
                var nextBoardingAt = vanaDate.start().time + this.offset;
                while (nextBoardingAt < vanaDate.time) {
                    nextBoardingAt = nextBoardingAt + this.cycle;
                }
                return new VanaDate(nextBoardingAt);
            },
            nextDeparture: function (vanaDate) {
                if (typeof (vanaDate) == 'undefined') {
                    vanaDate = new VanaDate();
                }
                // get the first departure of the day
                var nextDepartureAt = vanaDate.start().time + this.offset + this.boarding;
                while (nextDepartureAt < vanaDate.time) {
                    nextDepartureAt = nextDepartureAt + this.cycle;
                }
                return new VanaDate(nextDepartureAt);
            },
            isBoarding: function (vanaDate) {
                if (typeof (vanaDate) == 'undefined') {
                    vanaDate = new VanaDate();
                }

                // Find the beginning of the most recent bording phase
                var nextBoard = this.nextBoarding().time;
                var lastBoard = nextBoard - this.cycle;
                var lastBoardEnd = lastBoard + this.boarding;
                return (vanaDate.time < lastBoardEnd && vanaDate.time > lastBoard);
            },
            nextPhase: function (vanaDate) {
                // returns the next time the craft will start boarding or depart
                if (this.isBoarding(vanaDate)) {
                    return this.nextDeparture(vanaDate);
                } else {
                    return this.nextBoarding(vanaDate);
                }
            }
        };

        var airBoard = 0;                // TODO: How many seconds does an airship spend boarding?
        var airCycle = getSecs(6, 0);    // airships arrive every 6 hours (4 times per day)
        var airTravel = airCycle - airBoard;
        var ferryCycle = getSecs(8, 0);  // ferries arrive every 8 hours  (3 times per day)

        ////////////////////////////
        // FFXI class public members
        this.translations = _translations;
        this.shops = {
            fishing: new Shop(0, 5, 3, 18),
            woodworking: new Shop(1, 0, 6, 21),
            smithing: new Shop(2, 2, 8, 23),
            goldsmithing: new Shop(3, 4, 8, 23),
            clothcraft: new Shop(4, 0, 6, 21),
            leathercraft: new Shop(5, 4, 3, 18),
            bonecraft: new Shop(6, 3, 8, 23),
            alchemy: new Shop(7, 6, 8, 23),
            cooking: new Shop(8, 7, 5, 20),
            tenshodoj: new Shop(9, 1, 1, 23),
            tenshodob: new Shop(10, 4, 1, 23),
            tenshodon: new Shop(11, 7, 1, 23)
        };
        this.routes = {
            // Airships
            // TODO: Verify that these times are accurate
            jeunoToBastok: new Route(0, airBoard, airTravel, airCycle, getSecs(3, 11)),
            bastokToJeuno: new Route(1, airBoard, airTravel, airCycle, getSecs(0, 13)),
            jeunoToWindurst: new Route(2, airBoard, airTravel, airCycle, getSecs(1, 41)),
            windurstToJeuno: new Route(3, airBoard, airTravel, airCycle, getSecs(4, 47)),
            jeunoToSandoria: new Route(4, airBoard, airTravel, airCycle, getSecs(0, 11)),
            sandoriaToJeuno: new Route(5, airBoard, airTravel, airCycle, getSecs(3, 10)),
            jeunoToKazham: new Route(6, airBoard, airTravel, airCycle, getSecs(4, 49)),
            kazhamToJeuno: new Route(7, airBoard, airTravel, airCycle, getSecs(1, 48)),
            // Ferries have identical schedules in both directions, so we only need one for each route
            selbinaMhaura: new Route(8, getSecs(1, 20), getSecs(6, 40), ferryCycle, getSecs(6, 40)),
            alZahbiMhaura: new Route(9, getSecs(1, 20), getSecs(6, 40), ferryCycle, getSecs(2, 40)),
            alZahbiNashmau: new Route(10, getSecs(3, 0), getSecs(5, 0), ferryCycle, 0),
            // Manaclipper
            bibikiToPuronogo: new Route(11, getSecs(1, 0), getSecs(3, 0), getSecs(12, 0), getSecs(4, 50)),
            puronogoToBibiki: new Route(12, getSecs(0, 45), getSecs(3, 55), getSecs(12, 0), getSecs(0, 10)),
            reefTour: new Route(13, getSecs(0, 40), getSecs(4, 0), getSecs(24, 0), getSecs(12, 10)),
            rockTour: new Route(14, getSecs(0, 40), getSecs(4, 0), getSecs(24, 0), getSecs(0, 10))
        };

    };

    /////////////////////////////////////////////////////////////////////
    // VanaDate class
    // Represents a fixed point in time.
    // Constructor takes either a JavaScript Date representing Earth time,
    // or a number of Vana'diel seconds since Year 0.
    var VanaDate = makeClass();
    this.VanaDate = VanaDate;
    VanaDate.prototype = {
        init: function (date) {
            // vTime is the number of Vana'diel seconds since 0000/01/01
            var vTime, eTime;

            if (typeof (date) == 'number') {
                vTime = Math.round(date);
                eTime = new Date(EARTH_TIME_YEAR_0.getTime() + Math.round(vTime * 1000 / 25));
            } else {
                if (date instanceof Date) {
                    eTime = date;
                } else {
                    eTime = new Date();
                }

                var eMilliSinceVanaEpoch = eTime.getTime() - EARTH_TIME_YEAR_0.getTime();
                vTime = Math.round(eMilliSinceVanaEpoch / 1000 * 25);
            }

            // Calculate the individual parts of the date
            this.earthDate = eTime;
            this.time = vTime; // number of vana'diel seconds since midnight 0000/01/01
            this.year = Math.floor(vTime / VANA_SECS_PER_YEAR);
            this.month = Math.floor((vTime % VANA_SECS_PER_YEAR) / VANA_SECS_PER_MONTH);
            this.day = Math.floor((vTime % VANA_SECS_PER_MONTH) / VANA_SECS_PER_DAY);
            this.weekDay = Math.floor((vTime % VANA_SECS_PER_WEEK) / VANA_SECS_PER_DAY);
            this.hour = Math.floor((vTime % VANA_SECS_PER_DAY) / VANA_SECS_PER_HOUR);
            this.minute = Math.floor((vTime % VANA_SECS_PER_HOUR) / 60);
            this.second = Math.floor(vTime % 60);
            this.weekDayName = VanaDate.dayNames[this.weekDay];

            // Calculate phase of the moon.
            var daysPerCycle = 84;
            // This formula was borrowed from the MithraPride clock. I have no fucking clue what is going on here.
            // The value ranges from -100 (full) to 0 (new) to 100 (full again).
            var moonPercent = ((((Math.floor(vTime / VANA_SECS_PER_DAY) + 26) % daysPerCycle) - (daysPerCycle / 2)) / (daysPerCycle / 2)) * 100;

            // There are gaps in the ranges here, but it still works because the moon phase only changes
            // at the beginning of a new day rather than continuously over time.
            if (moonPercent >= 7 && moonPercent <= 38) {
                moonPhase = 1; // Waxing Crescent		
            } else if (moonPercent >= 40 && moonPercent <= 55) {
                moonPhase = 2; // First Quarter Moon
            } else if (moonPercent >= 57 && moonPercent <= 88) {
                moonPhase = 3; // Waxing Gibbous
            } else if (moonPercent >= 90 || moonPercent <= -95) {
                moonPhase = 4; // Full Moon
            } else if (moonPercent >= -93 && moonPercent <= -62) {
                moonPhase = 5; // Waning Gibbous
            } else if (moonPercent >= -60 && moonPercent <= -45) {
                moonPhase = 6; // Last Quarter Moon
            } else if (moonPercent >= -43 && moonPercent <= -12) {
                moonPhase = 7; // Waning Crescent
            } else {
                moonPhase = 0; // New Moon
            }
            this.moonPhase = moonPhase;
            this.moonPhaseName = VanaDate.moonPhases[moonPhase];
            this.moonPercent = Math.round(Math.abs(moonPercent));

            // Calculate when this day starts and ends in earth time
            var vSecSinceDayStart = (vTime % VANA_SECS_PER_DAY);
            var eMilliSinceDayStart = Math.floor(vSecSinceDayStart * 1000 / 25);
            this.dayStart = new Date(eTime.getTime() - eMilliSinceDayStart);

            var vSecUntilDayEnd = VANA_SECS_PER_DAY - (vTime % VANA_SECS_PER_DAY);
            var eMilliUntilDayEnd = Math.floor(vSecUntilDayEnd * 1000 / 25);
            this.dayEnd = new Date(eTime.getTime() + eMilliUntilDayEnd);
        },
        start: function () {
            var newVTime = this.time - (this.time % VANA_SECS_PER_DAY);
            return new VanaDate(newVTime);
        },
        next: function (days) {
            var numDays = days;
            if (typeof (numDays) != 'number') {
                day = 1;
            }
            var newVTime = this.time + (VANA_SECS_PER_DAY * numDays);
            return new VanaDate(newVTime);
        },
        previous: function (days) {
            var numDays = dayNum;
            if (typeof (numDays) != 'number') {
                day = 1;
            }

            var newVTime = this.time - (VANA_SECS_PER_DAY * numDays);
            return new VanaDate(newVTime);
        }
    };
    VanaDate.dayNames = ["Firesday", "Earthsday", "Watersday", "Windsday",
                         "Iceday", "Lightningday", "Lightsday", "Darksday"];
    VanaDate.moonPhases = ["New Moon", "Waxing Crescent", "First Quarter Moon", "Waxing Gibbous",
					     "Full Moon", "Waning Gibbous", "Last Quarter Moon", "Waning Crescent"];


    // Create an FFXI object and put VanaDate class in the global scope
    window.FFXI = new FFXI(window);
    window.VanaDate = VanaDate;
})(window);
