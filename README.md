# [A\* Algorithm Visualizer Intro:](https://alexyzha.github.io/AStar-Visualizer/)

A\* is an informed search algorithm used to find the shortest possible path between 2 nodes in a graph. This visualizer aims to show how A\* is able to find paths around obstacles. Click the title "A\* Algorithm Visualizer Intro" for the link to the actual visualizer :)

This demo uses a 2-dimensional graph (matrix). The backend is coded in C++, which is then exposed to JavaScript using [Emscripten](https://emscripten.org).

**Table of Contents:**
1. [A\* Algorithm Background](#a-algorithm-background)
2. [Code Documentation](#code-documentation)
3. [A list of my struggles with WASM and how I overcame those 😭](#wasm-emcc-pain-tears-mad-balding-malding)
4. [Credits to open source visual assets](#credits)

## A\* Algorithm Background:

**You should probably know:**
1. [Dijkstra's Algorithm](https://www.youtube.com/watch?v=_lHSawdgXpI)
2. [Some graph theory](https://en.wikipedia.org/wiki/Graph_theory)
3. [Greedy algorithms](https://www.geeksforgeeks.org/greedy-algorithms/)

A\* is an algorithm that combines aspects of greedy algorithms (more specifically, heuristics) and Dijkstra's algorithm.

Like Dijkstra's algorithm, A\* also searches for the shortest path between 2 nodes in a graph (or 2 tiles in a matrix in this example). Different paths from the starting node are weighted differently, and this aspect of A\* is directly borrowed from Dijkstra's algorithm. The algorithm decides on which node to travel to next based on these weights.

A\* differs from Dijkstra's algorithm because it uses [heuristics](https://en.wikipedia.org/wiki/Heuristic_(computer_science)) to help calculate the optimal path. The heuristic used for each application of A\* will differ, but in general, the heuristic used to aid in calculation estimates the cost (distance in this example) from a node to the end node. This means that A\* can prioritize nodes that seem like they're closer to the end node.

By combining aspects from Dijkstra's algorithm and greedy algorithms, A\* always accurately finds the shortest path possible.

**[IMPORTANT — HOW A\* WORKS:](https://ih1.redbubble.net/image.3842072201.6397/raf,360x360,075,t,fafafa:ca443f4786.jpg)** Some things of note are that A\* uses something called an **F-score**, which is the total estimated cost. the F-score is derived from the **G-score** (the cost from the starting node) and the **H-score** (the heuristic estimated cost to reach the end node). A\* uses these scores to determine which nodes to check next, as well as which nodes to add to the optimal path. Essentially, for all nodes:
- **F(n) = G(n) + H(n)**, where n is a node.

**A\* also uses open/closed sets**. The open set represents all the current nodes within reach that haven't been explored yet (this will be represented by a priority queue). The closed set represents all the nodes that cannot be reached because they are 1. blocked, or 2. already processed.
- Throughout it's time in the open set, a node may or may not be processed
- If a node reaches the front of the priority queue (open set), it is processed
- Processing a node means adding all of its neighboring nodes to the priority queue with their own respective F- and G-scores
- If a neighbor is blocked or in the closed set, it will not be added

Here are some visual examples. Let's work with a 3x3 excerpt from a matrix of arbitrary size. Each square (white/green, labeled 1-9) represents a node.

<img width="151" alt="Screenshot_2024-02-09_at_7 00 03_PM" src="https://github.com/alexyzha/AStar-Visualizer/assets/122637724/6aa4d88b-90e3-4372-85cb-9e0e19c4c419">

Since this is the very beginning of the algorithm, we initialize our open set (a priority queue) and place the starting node (the green node at position 5) in it. Nodes 1, 2, 3, 4, 6, 7, 8, and 9 are its neighbors, so they would all get put into a priority queue too. After all of the starting node's neighbors are inserted into the priority queue, we put the starting node in the closed set, because we don't want to backtrack to a node we've already processed. Now, the starting node has been processed!

<img width="148" alt="Screenshot_2024-02-09_at_6 56 13_PM" src="https://github.com/alexyzha/AStar-Visualizer/assets/122637724/3dac5968-414c-40c5-9193-4eb4bf6fdd2f">

Moving on, say for some reason nodes 2, 3, and 6 have the smallest F-scores. This means that they will all appear at the front of the open set (priority queue). We'll process them, and then close them just like we did with the starting node. We'll now end up with a configuration that looks like this:

<img width="151" alt="Screenshot_2024-02-09_at_6 57 28_PM" src="https://github.com/alexyzha/AStar-Visualizer/assets/122637724/092640de-3720-46fa-9f84-671428de21b5">

We will stop processing nodes when we reach the end node.

Finally, A\* also generally has a **best G-value map**. The logic is explained below:
1. Different paths to a node can lead to different G-values
2. We want to find the most optimal path, so ideally we want the lowest G-value for a node, since we can't change its H-value
3. Therefore, if we somehow for some reason end up on a node twice, we need to be able to choose the path that leads to the node which has the lowest F-value
4. F(n) = G(n) + H(n). However, we cannot change H(n). Therefore, we need to keep track of the lowest G-value the node has ever had

## Code Documentation:

I will not show the frontend part of this demo, as the algorithm itself matters more. (Also because the frontend doesn't do any computations 💀💀💀)

The file containing all the logic is located in [main/AStar.cpp](https://github.com/alexyzha/AStar-Visualizer/blob/main/AStar.cpp).

**Initial Setup:**

Let's start by outlining the setup:
1. This specific example uses a matrix as a map
2. Each node on the map is a matrix tile with coordinates (x,y)
3. We'll allow for 8-directional movement: {up, down, left, right, up-left, up-right, down-left, down-right}
4. We also need a priority queue for shortest path search

So we begin with these C++ standard libraries:
```cpp
//lines 1-5
#include <iostream>    //for debugging and printing matrix
#include <vector>      //for creating matrix and also for getting return path etc.
#include <algorithm>   //for auxillary functions
#include <queue>       //for the algorithm
using namespace std;   //because i'm lazy and it's not like i'm making my own classes 💀
```

Next, we're going to create a map for the heuristic part of this algorithm. Because the heuristic essentially just tells the algorithm how far away a node is from the end node, we can simply calculate the [Euclidean distance](https://en.wikipedia.org/wiki/Euclidean_distance) between every node in the graph and the end node. On a matrix, this is what it will look like:
```cpp
//lines 27-35, variable names changed to be more readable
vector<vector<double>> HeuristicMap(int col, int row, int END_X, int END_Y) {
    vector<vector<double>> HeuristicMapProduct(row,vector<double>(col,0.0));
    for(int i = 0; i < row; i++) {
        for(int j = 0; j < col; j++) {
            HeuristicMapProduct[i][j] = EuclideanDist(j,i,END_X,END_Y);
        }
    }
    return HeuristicMapProduct;
}

//lines 19-21, accessory function EuclideanDist, function name changed
//to be more readable
double EuclideanDist(int x1, int y1, int x2, int y2) {
    return sqrt(pow((x2-x1),2) + pow((y2-y1),2));
}

//line 88, creating the heuristic map
const vector<vector<double>> H_MAP = HMap(TEST_MAP[0].size(),TEST_MAP.size(),END_X,END_Y);
```

The HeuristicMap function (HMap in the actual code), given the dimensions of a matrix and the coordinates for the end node, will generate a heuristic map ([matrix](https://upload.wikimedia.org/wikipedia/en/c/c1/The_Matrix_Poster.jpg)) where every node in the matrix has a value that is the Euclidean distance between that node and the end node.

The EuclideanDist accessory function (EuDist in the actual code) returns the Euclidean distance between 2 sets of points.

The rest of the initiation part isn't very interesting, so here's the TL;DR:
1. The map the path is actually being found on is defined like this, where 1's are blocked nodes, and 0's are open nodes:
```cpp
//lines 71-80
const vector<vector<int>> TEST_MAP{{0,0,0,0,1,0,0,0,0,0},
                                   {0,0,0,0,0,1,0,0,0,0},
                                   {0,0,0,0,0,1,0,0,0,0},
                                   {1,1,0,0,0,1,0,0,0,0},
                                   {1,1,1,0,1,1,1,0,0,0},
                                   {0,1,0,1,1,0,1,1,0,0},
                                   {0,1,1,1,0,0,0,1,1,0},
                                   {0,0,0,0,1,0,0,0,1,0},
                                   {0,0,0,1,1,1,0,0,1,0},
                                   {0,0,0,1,0,0,0,0,0,0}};
```
2. The code in the main logic file ([main/AStar.cpp](https://github.com/alexyzha/AStar-Visualizer/blob/main/AStar.cpp)) is a little different from the one used as the backend to this GitHub pages website. This code prints to terminal to check the validity of the pathing. However, the actual pathing logic is the same.
3. The "//lines [num]-[num]" in each code block marks where it is in the file: [main/AStar.cpp](https://github.com/alexyzha/AStar-Visualizer/blob/main/AStar.cpp).
4. My variable naming scheme is 💩

With all that out of the way, we can finally move on to the actual algorithm part of A\*. 

**The Algorithm Part: 😳**

We'll create a "Node" struct because every node contains more information than can be stored in a matrix of doubles. Although we have the H-scores ([Read: "IMPORTANT..."](#a-algorithm-background)) for all the nodes, we still somehow need to store all these values:
1. F-score
2. G-score (nodes further along the path derive their G-scores from previous nodes)
3. Coordinates of the node (what tile they represent in the matrix. Because we are putting nodes in a priority queue, we need a quick and easy access to each Node's coordinates)

With all these needs in mind, we can create this Node struct where doubles F and G represent F- and G-scores respectively, while integers X and Y represent the coordinates of the node. The constructor will never be needed for anything other than declaring a node with all of these variables filled in, so it requires a 4-variable input:
```cpp
//lines 11-17
struct Node {
    double F;
    double G;
    int X;
    int Y;
    Node(double f, int x, int y, double g) : F(f), X(x), Y(y), G(g) {}
};
```

Now that the Node struct is defined, we can create a priority queue, as this will help us determine which nodes to check first. We can't just plug a Node struct into the [STL](https://www.geeksforgeeks.org/the-c-standard-template-library-stl/) standard priority queue, so we have to write a custom comparator function. The comparator function will order each node from lowest to highest in terms of F-score. Here it is:
```cpp
//line 99, expanded for aesthetics
auto comp = [](const Node a, const Node b) {
    return a.F > b.F;
};
```

Now, we can create the priority queue, our open set. If you have no idea what open/closed set means, [read: "IMPORTANT..."](#a-algorithm-background)
```cpp
//line 100
priority_queue<Node, vector<Node>, decltype(comp)> OPEN(comp);
```

Our closed set will need to record the open/closed status of every single node in the matrix. Therefore, to cut down on unnecessary complexity, we can just create a matrix of booleans of the same dimensions as the main map for our closed set. 0/false, means that the node is open or can be open, while a value of 1/true means that the node at that coordinate is either closed or blocked off. We initialize a matrix with all 0s, then, we iterate through the main map to find the blocked nodes. When we find one, we set its corresponding closed set status to true, effectively closing it:
```cpp
//lines 89-94
vector<vector<bool>> CLOSED(TEST_MAP.size(), vector<bool>(TEST_MAP[0].size(),0));
for(int i = 0; i < TEST_MAP.size(); i++) {
    for(int j = 0; j < TEST_MAP[0].size(); j++) {
        if(TEST_MAP[i][j] == 1) CLOSED[i][j] = 1;
    }
}
```

Now that the open and closed sets are set up, we can start actually inserting nodes into them. We must start somewhere, so we will insert the starting node into the priority queue. We also need to close the starting node, as we don't want it to be processed again after this.
```cpp
//lines 101-102, variable names have been changed for readability
OPEN.push(Node(H_MAP[START_Y][START_X]+0.0,START_X,START_Y,0.0));
CLOSED[START_Y][START_X] = 1;
```

One more thing before we can start calculating the optimal path, [the best G-value map](https://www.youtube.com/watch?v=ifaoKZfQpdA). Like the closed set, the best G-value map will also be a matrix the same size of the main map, for simplicity's sake. It will be initialized as a vector<vector<double>> with a default value of numeric_limits<double>::infinity(). This map is here to ensure that we will always keep the lowest possible G-value at every given node. Without it, it's pretty much impossible to still get the optimal path. Believe me, I've tried...

With everything else out of the way, we can **FINALLY** move on to the algorithm part of A\*, which somehow fits into only 17 lines of code (excluding all the auxillary functions 😭). The code in full is shown below, but later on, it's broken down into chunks and explained in more detail:
```cpp
//lines 105-122, main loop, variables renamed for clarity
while(OPEN.size()) {
    if(OPEN.top().X == END_X && OPEN.top().Y == END_Y) break;
    int topx = OPEN.top().X, topy = OPEN.top().Y;
    int CURRENT_G = OPEN.top().G;
    OPEN.pop();
    vector<pair<int,int>> neighbors = NEIGHBOR_FUNCTION(TEST_MAP,CLOSED,topx,topy);
    for(auto& n : neighbors) {
        int tempx = n.first, tempy = n.second;
        double NEW_G = CURRENT_G + FixedDist(topx,topy,tempx,tempy);
        double NEW_COST = NEW_G + H_MAP[tempy][tempx];
        if (NEW_G < BEST_G[tempy][tempx]) {
            BEST_G[tempy][tempx] = NEW_G;
            OPEN.push(Node(NEW_COST,tempx,tempy,NEW_G));
            RELATION[tempy][tempx] = {topx,topy};
        }
    }
    CLOSED[topy][topx] = 1;
}

/************************** AUXILLARY FUNCTIONS BELOW :) **************************/

//line 9, 8 directions specified for allowed movements/neighbors
const vector<pair<int,int>> DIRECTIONS{{0,-1},{0,1},{-1,0},{1,0},{-1,-1},{1,-1},{-1,1},{1,1}};

//lines 37-45, neighbor function (N_FXN) that returns a vector of pairs for all of a given node's valid neighbors
vector<pair<int,int>> NEIGHBOR_FUNCTION(const vector<vector<int>>& map, const vector<vector<bool>>& CLOSED, int x, int y) {
    vector<pair<int,int>> VALID_NEIGHBORS;
    for (auto& d : DIRECTIONS) {
        int NEW_X = x + d.first;
        int NEW_Y = y + d.second;
        if(NEW_X >= 0 && NEW_X < map[0].size() && NEW_Y >= 0 && NEW_Y < map.size() && !CLOSED[NEW_Y][NEW_X]) r.push_back({NEW_X, NEW_Y});
    }
    return VALID_NEIGHBORS;
}

//lines 23-25, fixed distance function which returns a simplified calculation for distance between 2 nodes
//this is used as an optimization over the euclidean distance function, as increments in G-value will only
//ever be 1 or sqrt(2), for cardinal and diagonal movements respectively
double FixedDist(int x1, int y1, int x2, int y2) {
    return abs(x1-x2) + abs(y1-y2) == 1.0 ? 1.0 : sqrt(2);
}
```

**Note:** The auxillary functions in the code above, NEIGHBOR_FUNCTION(...) (N_FXN in the actual code) and FixedDist(...) (FixDist in the actual code) help us determine which neighbors of the current node we can insert into the open set.

Basically, the main loop of A\*:
1. Checks if the current node is the end node. If it isn't, it is popped from the open set
```cpp
while(OPEN.size()) {
    if(OPEN.top().X == END_X && OPEN.top().Y == END_Y) break;
    int topx = OPEN.top().X, topy = OPEN.top().Y;                //making node variables accessible before pop
    int CURRENT_G = OPEN.top().G;                                //making node variables accessible before pop
    OPEN.pop();
    ...
```
2. Gets and inserts all the valid neighbors of the current node into the open set. If the new G-value for the neighbor node is better than the previous best G-value, override it, and then set that neighbor node's relation to the current node
```cpp
    vector<pair<int,int>> neighbors = NEIGHBOR_FUNCTION(TEST_MAP,CLOSED,topx,topy);
    for(auto& n : neighbors) {
        int tempx = n.first, tempy = n.second;                               //variable accessibility
        double NEW_G = CURRENT_G + FixedDist(topx,topy,tempx,tempy);         //variable accessibility
        double NEW_COST = NEW_G + H_MAP[tempy][tempx];                       //variable accessibility
        if(NEW_G < BEST_G[tempy][tempx]) {                                   //use best G-value map
            BEST_G[tempy][tempx] = NEW_G;
            OPEN.push(Node(NEW_COST,tempx,tempy,NEW_G));
            RELATION[tempy][tempx] = {topx,topy};
        }
    }
```
3. Put the current node in the closed set
```cpp
    ...
    CLOSED[topy][topx] = 1;
}
```
4. If no valid paths are found, the open set will eventually become empty. The while loop's condition will be satisfied, and the loop will end. If we try to trace back from the RELATIONS map using the end node, we will just get the pair -1,-1, which is the default value of every pair in the RELATIONS map.

That's it. That's A\*. It truly is one of the stars.

⭐⭐⭐⭐⭐

## WASM, EMCC, PAIN, TEARS, MAD, BALDING, MALDING

1. I couldn't get the module to expose C++ to JS to get exported for the longest time. The solution I reached is below:
```cpp
//compile line: emcc AStar-Client.cpp -o JStar.js --bind -s MODULARIZE=1 -s EXPORT_NAME='createModule' -O2 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS="['_free', '_malloc']" -lembind
//code:
EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("AStar", &AStar);
    emscripten::register_vector<int>("VectorInt");
}
```
2. The function I used to return flattene d vector<int> to JS had an error. So after HOURS of trying to set up a godforsaken webpage, I ran into an error with the pathing algorithm and ended up checking everything again. In [main/docs/AStar-Client.cpp](https://github.com/alexyzha/AStar-Visualizer/blob/main/docs/AStar-Client.cpp) there was an error within the ReturnPath function (lines 54-64). I'm not even going to lie, I have no clue how this error messed up the optimal path so much, but everything works now so I'm just going to pretend I didn't smack my head into a brick wall for hours because I threw a little bit on one tiny little function. The before and after is below, see if you can spot a difference... 😭
```cpp
//before:
vector<int> ReturnPath(vector<vector<pair<int,int>>>& RELATION, int tx, int ty, const vector<vector<int>>& map) {
    vector<int> r;
    pair<int,int> C_PAIR = pair<int,int>(tx,ty);
    pair<int,int> I_PAIR = pair<int,int>(-1,-1);
    r.push_back(C_PAIR.first);
    r.push_back(C_PAIR.second);
    while(C_PAIR != I_PAIR) {
        C_PAIR = RELATION[C_PAIR.second][C_PAIR.first];
        r.push_back(C_PAIR.first);
        r.push_back(C_PAIR.second);
    }
    return r;
}

//after:
vector<int> ReturnPath(vector<vector<pair<int,int>>>& RELATION, int tx, int ty, const vector<vector<int>>& map) {
    vector<int> r;
    pair<int,int> C_PAIR = pair<int,int>(tx,ty);
    pair<int,int> I_PAIR = pair<int,int>(-1,-1);
    while(C_PAIR != I_PAIR) {
        r.push_back(C_PAIR.first);
        r.push_back(C_PAIR.second);
        C_PAIR = RELATION[C_PAIR.second][C_PAIR.first];
    }
    return r;
}
```
3. Before compiling with EMCC on my own computer, I tried using WebAssembly Studio. That was a mistake, don't do that.

## Credits:

[Here](https://sourcefoundry.org/hack/) is the font I used on the webpage. I love it and I use it as my VSCode font too. Thank you to whoever made this font [:)](https://i.pinimg.com/736x/8b/2d/66/8b2d661b34473f48b167d3b476dd2199.jpg)

[Here](https://uiverse.io) is where I got the code bases for the buttons on the webpage. I changed some of the colors and animations, but the general shape/reactions are all derived from other CSS UI elements.

