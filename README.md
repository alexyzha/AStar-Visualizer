# [A\* Algorithm Visualizer Intro:](https://alexyzha.github.io/AStar-Visualizer/)

A\* is an informed search algorithm used to find the shortest possible path between 2 nodes in a graph. This visualizer aims to show how A\* is able to find paths around obstacles. Click the title "A\* Algorithm Visualizer Intro" for the link to the actual visualizer :)

This demo uses a 2-dimensional graph (matrix). The backend is coded in C++, which is then exposed to JavaScript using [Emscripten](https://emscripten.org).

This README page contains:
1. A\* algorithm background
2. Code documentation
3. A list of my struggles with WASM and how I overcame those 😭
4. Credits to open source visual assets

# A\* Algorithm Background:

You should probably know:
1. [Dijkstra's Algorithm](https://www.youtube.com/watch?v=_lHSawdgXpI)
2. [Some graph theory](https://en.wikipedia.org/wiki/Graph_theory)
3. [Greedy algorithms](https://www.geeksforgeeks.org/greedy-algorithms/)

A\* is an algorithm that combines aspects of greedy algorithms (more specifically, heuristics) and Dijkstra's algorithm.

Like Dijkstra's algorithm, A\* also searches for the shortest path between 2 nodes in a graph (or 2 tiles in a matrix in this example). Different paths from the starting node are weighted differently, and this aspect of A\* is directly borrowed from Dijkstra's algorithm. The algorithm decides on which node to travel to next based on these weights.

A\* differs from Dijkstra's algorithm because it uses [heuristics](https://en.wikipedia.org/wiki/Heuristic_(computer_science)) to help calculate the optimal path. The heuristic used for each application of A\* will differ, but in general, the heuristic used to aid in calculation estimates the cost (distance in this example) from a node to the end node. This means that A\* can prioritize nodes that seem like they're closer to the end node.

By combining aspects from Dijkstra's algorithm and greedy algorithms, A\* always accurately finds the shortest path possible.

**IMPORTANT:** Something of note are that A\* uses something called an F-score, which is the total estimated cost. the F-score is derived from the G-score (the cost from the starting node) and the H-score (the heuristic estimated cost to reach the end node). A\* uses these scores to determine which nodes to check next, as well as which nodes to add to the optimal path. Essentially:
- F(n) = G(n) + H(n), where n is a node.

# Code Documentation:

I will not show the frontend part of this demo, as the algorithm itself matters more. (Also because the frontend doesn't do any computations 💀💀💀)

The file containing all the logic is located in [main/AStar.cpp](https://github.com/alexyzha/AStar-Visualizer/blob/main/AStar.cpp).

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
3. My variable naming scheme is 💩

With all that out of the way, we can finally move on to the actual algorithm part of A\*. 

We'll create a "Node" struct because every node contains more information than can be stored in a matrix of doubles. T







