let innings=1,runs=0,wickets=0,balls=0,limit=20;
let target=0,firstScore=0,active=false;
let teamA="TEAM A",teamB="TEAM B";
let teams=[[],[]];
let batters=[],bowlers=[];
let striker=0,nonStriker=1,bowler=0;
let history=[],commentary=[];
let tournament="";
let points={};

function showTab(id){
document.querySelectorAll(".tab").forEach(x=>x.classList.add("hidden"));
document.getElementById(id).classList.remove("hidden");
if(id==="scorecard")renderCards();
if(id==="tournament")renderPoints();
}

function startMatch(){

teamA=document.getElementById("team1").value||"TEAM A";
teamB=document.getElementById("team2").value||"TEAM B";
limit=Number(document.getElementById("oversLimit").value);

if(!Number.isInteger(limit)||limit<1){
alert("Enter valid overs");return;
}

teams=[
document.getElementById("players1").value.split(",").map(x=>x.trim()).filter(Boolean),
document.getElementById("players2").value.split(",").map(x=>x.trim()).filter(Boolean)
];

if(teams[0].length===0)
teams[0]=Array.from({length:11},(_,i)=>"Player "+(i+1));

if(teams[1].length===0)
teams[1]=Array.from({length:11},(_,i)=>"Player "+(i+1));

innings=1;
runs=0;
wickets=0;
balls=0;
target=0;
firstScore=0;
history=[];
commentary=[];
active=true;

setupPlayers();

let winner=document.getElementById("tossWinner").value;
let decision=document.getElementById("tossDecision").value;

if((winner==="A"&&decision==="bowl")||
(winner==="B"&&decision==="bat")){
innings=2;
firstScore=0;
target=1;
}

document.getElementById("result").innerText="Match in progress";
document.getElementById("history").innerHTML="";
update();
}

function setupPlayers(){
batters=teams[innings-1].map(name=>({
name,runs:0,balls:0,fours:0,sixes:0,out:false
}));
let bowlingTeam=teams[innings===1?1:0];
bowlers=bowlingTeam.map(name=>({
name,runs:0,wickets:0,balls:0
}));
striker=0;
nonStriker=1;
bowler=0;
}

function save(){
history.push(JSON.stringify({
innings,runs,wickets,balls,target,firstScore,
batters,bowlers,striker,nonStriker,bowler,
commentary,active
}));
}

function addRun(n){
if(!canPlay())return;
save();
let p=batters[striker];
p.runs+=n;
p.balls++;
if(n===4)p.fours++;
if(n===6)p.sixes++;
runs+=n;
bowlers[bowler].runs+=n;
legalBall();
if(n%2===1)swap();
if(n===4||n===6)log(n+" RUNS - "+(n===4?"FOUR":"SIX"));
else log(n+" RUN");
afterBall();
}

function addWicket(){
if(!canPlay())return;
save();
batters[striker].balls++;
batters[striker].out=true;
wickets++;
bowlers[bowler].wickets++;
legalBall();
log("WICKET!");
let next=batters.findIndex((p,i)=>!p.out&&i!==striker&&i!==nonStriker&&
![striker,nonStriker].includes(i));
if(next!==-1)striker=next;
afterBall();
}

function addExtra(type){
if(!canPlay())return;
save();
runs++;
bowlers[bowler].runs++;
if(type==="WD"||type==="NB"){
if(type==="WD")runs+=0;
log(type+" +1");
}else{
balls++;
bowlers[bowler].balls++;
log(type+" +1");
}
afterBall();
}

function legalBall(){
balls++;
bowlers[bowler].balls++;
if(balls%6===0){
swap();
bowler=(bowler+1)%bowlers.length;
}
}

function swap(){
[striker,nonStriker]=[nonStriker,striker];
}

function canPlay(){
return active&&wickets<10&&balls<limit*6;
}

function log(text){
commentary.unshift(text);
document.getElementById("history").innerHTML=
commentary.map((x,i)=>"<div>"+(i+1)+". "+x+"</div>").join("");
}

function afterBall(){
update();
if(innings===2&&runs>=target){
finish();
}else if(wickets>=10||balls>=limit*6){
if(innings===1)endInnings();
else finish();
}
}

function endInnings(){
if(!active)return;
if(innings===1){
firstScore=runs;
target=runs+1;
innings=2;
runs=0;wickets=0;balls=0;
commentary=[];
setupPlayers();
document.getElementById("history").innerHTML="";
update();
}else finish();
}

function finish(){
active=false;
let result;
if(innings===1){
result="First innings completed";
}else if(runs>=target){
result=teamB+" WON BY "+(10-wickets)+" WICKETS";
}else if(runs===firstScore){
result="MATCH TIED";
}else{
result=teamA+" WON BY "+(firstScore-runs)+" RUNS";
}
document.getElementById("result").innerText=result;
document.getElementById("matchStatus").innerText="MATCH FINISHED";
update();
saveMatch();
}

function undo(){
if(!history.length)return;
let s=JSON.parse(history.pop());
Object.assign(window,s);
commentary=s.commentary;
document.getElementById("history").innerHTML=
commentary.map(x=>"<div>"+x+"</div>").join("");
update();
}

function update(){
document.getElementById("battingTeam").innerText=
innings===1?teamA:teamB;
document.getElementById("runs").innerText=runs;
document.getElementById("wickets").innerText=wickets;
document.getElementById("overs").innerText=
Math.floor(balls/6)+"."+(balls%6);
document.getElementById("crr").innerText=
balls?(runs/(balls/6)).toFixed(2):"0.00";
document.getElementById("target").innerText=
innings===2?target:"-";
let remaining=limit*6-balls;
document.getElementById("rrr").innerText=
innings===2&&remaining>0?
Math.max(0,(target-runs)*6/remaining).toFixed(2):"-";
document.getElementById("matchStatus").innerText=
active?"MATCH IN PROGRESS":"MATCH NOT STARTED";
localStorage.setItem("cricketProV4",JSON.stringify({
innings,runs,wickets,balls,limit,target,firstScore,
active,teamA,teamB,teams,batters,bowlers,striker,
nonStriker,bowler,commentary,history
}));
}

function saveMatch(){
localStorage.setItem("lastCricketMatch",JSON.stringify({
teamA,teamB,runs,wickets,innings,firstScore
}));
}

function resumeMatch(){
let s=localStorage.getItem("cricketProV4");
if(!s){alert("No saved match found");return;}
Object.assign(window,JSON.parse(s));
document.getElementById("history").innerHTML=
commentary.map(x=>"<div>"+x+"</div>").join("");
update();
alert("Saved match restored");
}

function renderCards(){
document.getElementById("battingCard").innerHTML=
batters.map(p=>"<p>${p.name} - ${p.runs} runs (${p.balls} balls), 4s:${p.fours}, 6s:${p.sixes} ${p.out?"OUT":"NOT OUT"}</p>").join("");
document.getElementById("bowlingCard").innerHTML=
bowlers.map(p=>"<p>${p.name} - ${p.wickets} wickets, ${p.runs} runs, ${Math.floor(p.balls/6)}.${p.balls%6} overs</p>").join("");
}

function createTournament(){
tournament=document.getElementById("tournamentName").value;
if(!tournament){alert("Enter tournament name");return;}
localStorage.setItem("cricketTournament",tournament);
document.getElementById("tournamentInfo").innerText=
tournament+" created successfully!";
}

function renderPoints(){
let p=JSON.parse(localStorage.getItem("cricketPoints")||"{}");
document.getElementById("pointsTable").innerHTML=
Object.entries(p).map(([name,x])=>
"<tr><td>${name}</td><td>${x.played}</td><td>${x.won}</td><td>${x.lost}</td><td>${x.points}</td></tr>"
).join("");
}

function downloadPDF(){
if(!window.jspdf){alert("PDF library unavailable");return;}
renderCards();
const {jsPDF}=window.jspdf;
const pdf=new jsPDF();
pdf.text("CRICKET SCORER PRO - SCORECARD",10,15);
pdf.text(teamA+" vs "+teamB,10,25);
pdf.text("Score: "+runs+"/"+wickets,10,35);
pdf.text("Overs: "+Math.floor(balls/6)+"."+balls%6,10,45);
let y=60;
batters.forEach(p=>{
pdf.text("${p.name}: ${p.runs} (${p.balls})",10,y);
y+=8;
});
pdf.save("Cricket-Scorecard.pdf");
}

function shareScore(){
let text="${teamA} vs ${teamB}\nScore: ${runs}/${wickets}\nOvers: ${Math.floor(balls/6)}.${balls%6}";
if(navigator.share){
navigator.share({title:"Cricket Live Score",text});
}else{
navigator.clipboard.writeText(text);
alert("Score copied!");
}

}
