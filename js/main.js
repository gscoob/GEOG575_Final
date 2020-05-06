// JavaScript by Greg Farnsworth, 2020
// Final Commit 5/5/2020
//

(function(){

//===========================//
//==pseudo-global variables==//
    
    var answerArray = ["geo_id",
                       "geo_name",
                       "geo_abbrv",
                       "geo_pop",
                       "geo_acres",
                       "geo_dens"
                      ],
        questionArray = ["q_id",
                         "question",
                         "answer_state",
                         "answer_text",
                         "raw_prefix",
                         "raw_suffix",
                         "norm_prefix",
                         "norm_suffix"
                        ],
        reactArray = [ ["Great job!",
                        "Way to go!",
                        "You really know your stuff!",
                        "Smarty pants!",
                        "Piece of cake!"],
                       ["Oh, so close...",
                        "You almost had it...",
                        "Missed it by that much...",
                        "That's a tough loss...",
                        "Who knew..."]
                     ];

    var expressed = "NULL",
        displayed = "NULL",
        questionText = "NULL",
        questionID = "NULL",
        selectedSateName = "NULL",
        selectedStateID = "NULL",
        correctStateName = "NULL",
        correctStateID = "NULL",
        lowestStateName = "NULL",
        lowestStateID = "NULL",
        answerText = "NULL",
        answerState = "NULL";
    
    var mapWidth = window.innerWidth * 0.65,
        boxWidth = window.innerWidth * 0.10;

    var mapHeight = window.innerHeight * 0.75;
    
    var playerResults, gameStatus, scorAi, scorCi, scorSi;
    var radius = 10;
    var centroids, areas, remainQsArray;
    
    var questionData;
    var answerData;
    var colorClasses;
    var runOnce = false;
    
    var comma = d3.format(",");

    
//==================================//    
//==begin script when window loads==//
    
    window.onload = setPage();

    
    //set up choropleth map
    function setPage(){
        
        gameStatus = "Loading"
        runOnce = true;

        buildHeader()
        buildRuleBox()

        //create new svg container for the map
        var map = d3.select(".flex")
            .append("svg")
            .attr("class", "map")
            .attr("width", mapWidth)
            .attr("height", mapHeight);
        
        //create Albers equal area conic projection centered on us
        var projection = d3.geoAlbers()
              .parallels([32, 45])
              .rotate([99, 0])
              .center([2, 40.25])
              .scale(1300);

        var path = d3.geoPath()
            .projection(projection);

        d3.queue()
            .defer(d3.csv, "data/dataQuestions.csv") //load attributes from csv
            .defer(d3.csv, "data/dataAnswers.csv") //load attributes from csv
            .defer(d3.json, "data/Country.topojson") //load background spatial data
            .defer(d3.json, "data/State.topojson") //load choropleth spatial data
            .await(callback);

        function callback(error, csvQs, csvAs, tCountry, tState){

            questionData = csvQs;
            answerData = csvAs;

            for (var i=0; i<questionData.length; i++){
                answerArray.push(questionData[i].q_id+"raw")
                answerArray.push(questionData[i].q_id+"norm")
            }

            createButtons(questionData);
            
            //place graticule on the map
            drawGraticule(map, path);

            //translate na and us TopoJSONs
            var mCountry = topojson.feature(tCountry, tCountry.objects.Country),
                mState = topojson.feature(tState, tState.objects.State).features;
            
            //add na countries to map
            var countries = map.append("path")
                .datum(mCountry)
                .attr("class", "countries")
                .attr("d", path);

            //join csv data to GeoJSON enumeration units
            mState = joinStateData(mState, answerData);

            //add enumeration units to the map
            drawStates(mState, map, path);
            
            buildScoreBox();
            
        };
    }; //end of setMap()

    
    
    //function to create dynamic label
    function buildHeader(){
                          
        var headTitle = d3.select(".header")
            .append("div")
            .attr("id", "title")
            .text('The "Lower 48" Geo Quiz');
    };
        
    
    function buildRuleBox(){
    
        var ruleH = "How To Play"
        var rule1 = '<span id="rul">1. Click on the Green Button to Select a Question</span>'
        var rule2 = '<span id="rul">2. Click on a State to Choose Your Answer</span><br><br>A banner will appear across the top of the page revealing the correct answer. Click anywhere on the banner to remove it.'
        var rule3 = '<span id="rul">3. Click the Green Button to Select the Next Question</span><br><br>Once you have seen all the questions the game will end. To play again, simply click the Game Over banner.'
        
        d3.select("body")
            .append("div")
            .attr("class", "rulebox")            
    
        d3.select(".rulebox")
            .append("div")
            .attr("class", "rulehead")
            .html(ruleH);
        d3.select(".rulebox")
            .append("div")
            .attr("class", "rulegoo")
            .html(rule1);
        d3.select(".rulebox")
            .append("div")
            .attr("class", "rulegoo")
            .html(rule2);  
        d3.select(".rulebox")
            .append("div")
            .attr("class", "rulegoo")
            .html(rule3); 
    }
    
    
    
    function buildScoreBox(){
    
        var scorH = "Game Progress"
        var scor1 = '<span id="sco">Remaining</span>'
        var scor2 = '<span id="sco">Answered</span>'
        var scor3 = '<span id="sco">Correct</span>'
        var scor4 = '<span id="sco">Score</span>'
        
        var scorR = questionData.length - 1
        var scorA = "0"
        var scorC = "?"
        var scorS = "?"
        
        scorAi = scorCi = scorSi = 0
        
        var scorebox = d3.select("body")
            .append("div")
            .attr("class", "scorebox")
        
        scorebox.append("div")
            .attr("class", "scorehead")
            .html(scorH);
        scorebox.append("div")
            .attr("class", "scoregoo")
            .html(scor1);
         scorebox.append("div")
            .attr("class", "scorenbr")
            .attr("id", "scorR")
            .html(scorR);        
        scorebox.append("div")
            .attr("class", "scoregoo")
            .html(scor2);
         scorebox.append("div")
            .attr("class", "scorenbr")
            .attr("id", "scorA")
            .html(scorA);
        scorebox.append("div")
            .attr("class", "scoregoo")
            .html(scor3);
         scorebox.append("div")
            .attr("class", "scorenbr")
            .attr("id", "scorC")
            .html(scorC);
        scorebox.append("div")
            .attr("class", "scoregoo")
            .html(scor4);
         scorebox.append("div")
            .attr("class", "scorenbr")
            .attr("id", "scorS")
            .html(scorS);
    }
    
    function drawGraticule(map, path){
        
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
    };

    
    function joinStateData(mState, csvData){
        
        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvState = csvData[i]; //the current region
            var csvKey = csvState.geo_name; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a=0; a<mState.length; a++){

                var geojsonProps = mState[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.geo_name; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){

                    //assign all attributes and values
                    answerArray.forEach(function(attr){
                        if (isNaN(csvState[attr])) {
                          var val = csvState[attr];
                        } else {
                          var val = parseFloat(csvState[attr]);
                        } 
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                }
            }
        }
        return mState;
    };


    function drawStates(mState, map, path){

        centroids = mState.map(function (feature){
            return [feature.properties.geo_id, path.centroid(feature)];
        });
        
        areas = mState.map(function (feature){
            return [feature.properties.geo_id, path.area(feature)];
        });
        
        //add us regions to map
        var states = map.selectAll(".states")
            .data(mState)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "states " + d.properties.geo_id;
            })
            .attr("d", path)
            .style("fill", "#ddd")

        setEventListeners(true, true, true);
        
        var desc = states.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.25px"}');
    };

    
    
    function resetStates(){
        
        if ($(".alert").is(":visible")) {
            $(".alert").dialog("close")                   
        }
        
        d3.select("#star")
            .remove()
        d3.selectAll(".guess")
            .remove()
        
        d3.selectAll(".states")
            .style("fill", "#ddd")
            .style("stroke", "#000")
            .style("stroke-width", "0.25px");

        if (runOnce) {
            d3.select(".map").style("pointer-events", "none")
            var ratW = 14
            var ratH = 24
            var ratA = ratW/ratH

            function animateGuess(callback) {
                setTimeout(function(){

                    var newW = Math.floor(Math.random() * 60)
                    if (newW < 14) {ratW = 14} else {ratW = newW}
                    ratH = Math.floor(ratW/ratA)

                    var statexy = centroids[Math.floor(Math.random() * centroids.length)];
                    var st = statexy[0,0]
                    var xy = statexy[0,1]

                    d3.select(".map")
                        .append("svg:image")
                        .attr("xlink:href", "../img/guess.png")
                        .attr("class", "guess")
                        .attr("id", "guess_"+st)
                        .attr("x", xy[0])
                        .attr("y", xy[1])
                        .attr("width", ratW)
                        .attr("height", ratH);
                        
                    d3.select("#guess_"+st)
                        .transition()
                        .delay(function(){return ((Math.floor(Math.random() * 500)));})
                        .duration(350)
                        .style("opacity", 1)
                            .transition()
                            .delay(1000)
                            .duration(250)
                            .style("opacity", 0)

                    callback(null);
                },100);
            }

            var q = d3.queue(3);

            for (var j = 0; j < 60; ++j) {
              q.defer(animateGuess);
            }

            q.awaitAll(function(error) {
                if (error) throw error;
                setTimeout(function(){
                    d3.select(".map").style("pointer-events", "auto")
                    d3.select(".selector").style("visibility", "visible")
                }, 2000);
 //               d3.select(".map").style("pointer-events", "auto")
            })
        }
        gameStatus = "Playing"
        runOnce = false;
    };
    
    
    function createButtons(csvData){
        
        d3.select(".selector").remove();
        
        remainQsArray = [];
        
        for (var i=0; i<csvData.length; i++){
            var val = csvData[i]["question"];
            if (typeof val == 'string'){
                remainQsArray.push(val);
            } 
        }; 

        //add select element
        var selector = d3.select(".controls")
            .append("button")
            .attr("class", "selector")
            .attr("id", "question")
            .text("Click HERE to Show the First Question and Start the Quiz!")
            .on("click", function(){
                updateButton();
            });
        
    };
    
    function updateButton(){

        if (runOnce) {
            d3.select(".selector").style("visibility", "hidden")
            d3.select(".map")
                .transition()
                .duration(1500)
                .ease(d3.easeCircleOut)
                .style("opacity", 1)
                .style("visibility", "visible")
            gameStatus = "Waiting"
        }
        
        resetStates()
        shuffle(remainQsArray)
        questionText = remainQsArray.pop()

        var scorR = remainQsArray.length - 1
        d3.select("#scorR").html(scorR)
        
        if(remainQsArray.length == 0){
            var scorR = remainQsArray.length
            d3.select(".selector")
                .text("That's all folks!  You've seen all the questions.")
                .style("font-family", "Patrick Hand")
            setEventListeners(false,false,false)
            d3.select(".selector").style("pointer-events", "none")
            gameOver();
        } else {
            var scorR = remainQsArray.length - 1
            d3.select(".selector")
                .text("Which state " + questionText + "?")
                .style("font-family", "Patrick Hand")
            setEventListeners(true,true,false)             
        }  
        
        d3.select("#scorR").html(scorR)
    }

    
    function launchGame(props){

        gameStatus = "Running"
        
        setEventListeners(false, false, false);
        d3.select(".selector").style("pointer-events", "none")

        d3.select("#scorA").html(++scorAi)
        
        for(var i = 0; i < centroids.length; i++) {
           if(centroids[i][0] == props.geo_id) {
               var mp = centroids[i][1];
           }
        }
        
        var xy = shiftCentroid(props.geo_abbrv, mp);
        
        for(var i = 0; i < areas.length; i++) {
           if(areas[i][0] == props.geo_id) {
               var ar = areas[i][1];
           }
        }
        
        var maxArea = Math.max.apply(Math, areas.map(function (i) {return i[1]}));
        var starSize = 800 * (ar/maxArea)
        if(starSize<100){starSize=100}
        
        d3.select(".map")
            .append("path")
            .attr("id", "star")
            .attr("d", d3.symbol().type(d3.symbolStar).size(starSize))
            .attr("transform", "translate("+xy[0]+","+xy[1]+")")
            .style("fill", "black")
            .style("stroke", "black")
            .style("stroke-width", "1")
            .on("mouseover", function(d){spinStar(xy)})
        
        selectedStateName = props.geo_name;
        selectedStateID = props.geo_id;
        
        for (var i=0; i<questionData.length; i++){
            if (questionData[i]["question"] == questionText){
                questionID = questionData[i]["q_id"]
                answerState = questionData[i]["answer_state"]
                answerText = questionData[i]["answer_text"]
            }
        };

        expressed = questionID+"norm";
        displayed = questionID+"raw";

        loadAnswers()
        runAnimation(xy) 
        
        setTimeout(showResults, 7000, props);
    };
    
    function loadAnswers(){

        answerData.sort(function(a, b){return d3.descending(parseFloat(a[expressed]), parseFloat(b[expressed]));});

        correctStateID = answerData[0]["geo_id"]
        correctStateName = answerData[0]["geo_name"]

        if (selectedStateID == correctStateID) {playerResults = 0} else {playerResults = 1}        
    }
    
    
    function runAnimation(xy){

        var colorScale = quantileColorScale(answerData);
        
        var arrStates = [];
        for (var i=0; i<answerData.length; i++){
            var val = answerData[i]["geo_id"];
            if (typeof val == 'string'){
                arrStates.push(val);
            } 
        };
        
        var colorClasses = ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486'];
     
        function animateStates(callback) {
            setTimeout(function(){

                var randomState = arrStates[Math.floor(Math.random() * arrStates.length)];
                var randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
               
                if(randomState !== selectedStateID){
                    d3.select("."+randomState)
                        .transition()
                        .duration(500)
                        .style("fill", randomColor);
                    d3.select("."+randomState)
                        .transition()
                        .delay(500)
                        .duration(500)
                        .style("fill", "#ddd");
                };
                callback(null);
            },25);
        }

        var q = d3.queue(4);

        for (var j = 0; j < 128; ++j) {
          q.defer(animateStates);
        }

        q.awaitAll(function(error) {
          if (error) throw error;
            d3.selectAll(".states")
                .transition()
                .delay(1000)
                .duration(1000)
                .style("fill", function(d){
                    return choropleth(d.properties, colorScale)
                });

            d3.select("."+correctStateID)
                .transition()
                .delay(2000)
                .duration(1000)
                .style("fill", "green")
                .style("stroke", "gold")
                .style("stroke-width", "3")
            if(selectedStateID == correctStateID){
                d3.select("#star")
                    .transition()
                    .delay(2500)
                    .duration(500)
                    .style("fill", "gold")
            } else {
                d3.select("#star")
                    .transition()
                    .delay(2500)
                    .duration(500)
                    .style("fill", "red")
                    .style("opacity", 0.5)
            }        
        });
    };
    
    
    function showResults(props){
        
        reactText = reactArray[playerResults][(Math.floor(Math.random() * 5))]
        if (playerResults == 0) {var reactColor = "#00c73f"} else {var reactColor = "#c70000"}
        var infoDesc1 = correctStateName + " " + questionText + "!";
        var infoDesc2 = answerText;
        
        //label content
        var infoAttribute1 = '<h2 id="res">' + infoDesc1 + '</h2>';
        var infoAttribute2 = '<h2 id="res2">' + infoDesc2 + '</h2>';
        var playerAttribute = '<h2>' + reactText + '</h2>';
        
        //create info label div
        var bannerResults = d3.select(".flex")
            .append("div")
            .attr("class", "resultsbox")
            .style("background-color", reactColor)
            .on("click", function(){
                    this.remove();
                })
            .html(playerAttribute)
    
        d3.select(".resultsbox")
            .append("div")
            .attr("class", "resultsgoo")
            .html(infoAttribute1)
                  
        d3.select(".resultsbox")
            .append("div")
            .attr("class", "resultsgoo")
            .html(infoAttribute2);
        
        d3.select(".resultsbox")
            .transition()
                .delay(500)
                .duration(1000)
                .style("visibility", "visible")
                .style("opacity", 1)
    
        gameStatus = "Finished"
        setEventListeners(true,false,false)
        d3.select(".selector").style("pointer-events", "auto")
        
        if (playerResults == 0) {
            d3.select("#scorC").html(++scorCi)
        } else {
            d3.select("#scorC").html(scorCi)
        }
        
        scorSi = ((scorCi / scorAi) * 100).toFixed(0)+"%"
        d3.select("#scorS").html(scorSi)
    }
    
    
    function gameOver(){
        
        questionText = "NULL";
        
        //label content
        var infoAttribute1 = '<h2 id="gos">Thank you for playing!</h2>';
        var infoAttribute2 = '<h2 id="gos2">Hopefully you enjoyed learning more about the geography of the "Lower 48" states.</h2>';
        var playerAttribute = '<h2>GAME OVER</h2>';
        
        //create info label div
        var bannerGameOver = d3.select(".flex")
            .append("div")
            .attr("class", "gameoverbox")
            .style("background-color", "blue")
            .on("click", function(){
                    createButtons(questionData)
                    resetStates()
                    setEventListeners(true,true,false)
                    d3.select(".selector").style("pointer-events", "auto")
                    this.remove();
                })
            .html(playerAttribute)
    
        d3.select(".gameoverbox")
            .append("div")
            .attr("class", "gameovergoo")
            .html(infoAttribute1)
                  
        d3.select(".gameoverbox")
            .append("div")
            .attr("class", "gameovergoo")
            .html(infoAttribute2);
        
        d3.select(".gameoverbox")
            .transition()
                .delay(500)
                .duration(1000)
                .style("visibility", "visible")
                .style("opacity", 1)
    
        gameStatus = "Over"
    }
    
    
    //function to create color scale generator
    function quantileColorScale(data){
        var colorClasses = ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486'];

        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i<data.length; i++){
            var val = parseFloat(data[i][expressed]);
            if (typeof val == 'number' && !isNaN(val)){
                domainArray.push(val);
            } 
        };

        colorScale.domain(domainArray);

        return colorScale;
    };
    


    //function to test for data value and return color
    function choropleth(props, colorScale){
        //make sure attribute value is a number
        var val = parseFloat(props[expressed]);

        //if attribute value exists, assign a color; otherwise assign gray
        if (typeof val == 'number' && !isNaN(val)){
            return colorScale(val);
        } else {
            return "#CCC";
        };
    };
    
            
    //function to highlight enumeration units and bars
    function highlight(props){
        switch(gameStatus) {
            case "Playing":
                var selected = d3.selectAll("." + props.geo_id)
                    .style("stroke", "blue")
                    .style("stroke-width", "3");
                setInfoSelect(props);
                break;
            case "Finished":
                setInfoResult(props);
                break;
        }
    };
    
    
    //function to reset the element style on mouseout
    function dehighlight(props){
        
        d3.select(".infolabel")
            .remove();
        
        if (gameStatus !== "Finished") { 
            var selected = d3.selectAll("." + props.geo_id)
                .style("stroke", function(){
                    return getStyle(this, "stroke")
                })
                .style("stroke-width", function(){
                    return getStyle(this, "stroke-width")
                });
        }

        function getStyle(element, styleName){
            var styleText = d3.select(element)
                .select("desc")
                .text();

            var styleObject = JSON.parse(styleText);

            return styleObject[styleName];
        };
    };
        

    //function to create dynamic label
    function setInfoSelect(props){
        
        var stateName = "Click to Select " + props.geo_name.toUpperCase() + " as the Answer"
        var infoAttribute1 = "Population: " + comma(props.geo_pop) 
        var infoAttribute2 = "Land Area: " + comma(Math.floor(props.geo_acres/640)) + " sq miles"
        
        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.geo_id + "_label");
        
        infolabel.append("div")
            .attr("class", "infohead")
            .html(stateName);
        infolabel.append("div")
            .attr("class", "infogoo")
            .html(infoAttribute1);
        infolabel.append("div")
            .attr("class", "infogoo")
            .html(infoAttribute2);
    };

    
    function setInfoResult(props){
        
        function nth(n){return["st","nd","rd"][((n+90)%100-10)%10-1]||"th"};

        var idxRank = answerData.findIndex(function (i) {return i.geo_id === props.geo_id})+1
        var ordRank = idxRank + nth(idxRank)
       
        var showRaw = comma(Math.round(props[displayed]))
        
        if (questionID==="q06"){
            var showNorm = comma(Math.round(props.geo_pop/props.q06raw))
        } else {
            var showNorm = comma(Math.round(props[expressed],1)) 
        }

        var idxLoad = questionData.findIndex(function (i) {return i.q_id === questionID})
        
        var stateName = props.geo_name.toUpperCase() + " is ranked " + ordRank + " on this question!"
        var infoAttribute1 = questionData[idxLoad].raw_prefix + " " + showRaw + " " + questionData[idxLoad].raw_suffix
        var infoAttribute2 = questionData[idxLoad].norm_prefix + " " + showNorm + " " + questionData[idxLoad].norm_suffix
        
        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.geo_id + "_label");
        
        infolabel.append("div")
            .attr("class", "infohead")
            .html(stateName);
        infolabel.append("div")
            .attr("class", "infogoo")
            .html(infoAttribute1);
        infolabel.append("div")
            .attr("class", "infogoo")
            .html(infoAttribute2);
    };   

    function moveInfobox(){
        //get width of label
        var infoboxWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;
        
        var infoboxHeight = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .height;
        
        //use coordinates of mousemove event to set label coordinates
        var x1 = d3.event.clientX + 30,
            y1 = d3.event.clientY + 20,
            x2 = d3.event.clientX - infoboxWidth - 10,
            y2 = d3.event.clientY - infoboxHeight - 10;

        //horizontal label coordinate, testing for overflow
        var x = d3.event.clientX > window.innerWidth - infoboxWidth - 50 ? x2 : x1; 
        //vertical label coordinate, testing for overflow
        var y = d3.event.clientY > window.innerHeight - infoboxHeight - 50 ? y2 : y1; 

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };

    
    var shuffle = function (array) {

        var currentIndex = array.length;
        var temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;

    };
    
    
    function warnSelect() {

        $('#mess').text("Use the button above to select a question, then click on the state that you think is the correct answer!")
        
        $('.alert').dialog({
            title: "Please Select a Question",
            resizable: false,
            modal: false,
            show: { effect: "explode", duration: 500 },
            hide: { effect: "explode", duration: 500 }
        });
    }
    
        
    function setEventListeners(m,c,f){
        if(m){
            d3.selectAll(".states")
                .on("mouseover", function(d){
                    highlight(d.properties);
                })
                .on("mouseout", function(d){
                    dehighlight(d.properties);
                })
                .on("mousemove", moveInfobox);
        } else {
            d3.selectAll(".states")
                .on("mouseover", null)
                .on("mouseout", null)
                .on("mousemove", null);
        }
        
        if(c){
            d3.selectAll(".states")
                .on("click", function(d){
                    if (questionText == "NULL") {
                        warnSelect();
                    } else {
                        dehighlight(d.properties);
                        launchGame(d.properties);
                    }
                })
        } else {
            d3.selectAll(".states")
                .on("click", null)
        }  
    }

    function shiftCentroid(st,mp){
        switch(st) {
            case "CA":
                mp[0] = mp[0]-5
                mp[1] = mp[1]+5
                return mp;
                break;
            case "FL":
                mp[0] = mp[0]+15
                return mp;
                break;
            case "LA":
                mp[0] = mp[0]-10
                return mp;
                break;
            case "MA":
                mp[1] = mp[1]-3
                return mp;
                break;
            case "MD":
                mp[0] = mp[0]+5
                mp[1] = mp[1]-3
                return mp;
                break;
            case "MI":
                mp[0] = mp[0]+10
                mp[1] = mp[1]+15
                return mp;
                break;
            case "NJ":
                mp[0] = mp[0]+5
                return mp;
                break;
            default:
                return mp;
        }
    }
    
    function spinStar(xy){
        d3.select("#star")
            .transition()
            .duration(300)
            .attr("transform", "translate("+xy[0]+","+xy[1]+")scale(2.5)rotate(120)")
            .transition()
            .delay(310)
            .duration(300)
            .attr("transform", "translate("+xy[0]+","+xy[1]+")scale(1)rotate(-120)");
    }
        
})(); //last line of main.js
