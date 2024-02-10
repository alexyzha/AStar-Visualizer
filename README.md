# [A\* Algorithm Visualizer Intro:](https://alexyzha.github.io/AStar-Visualizer/)

A\* is an informed search algorithm used to find the shortest possible path between 2 nodes in a graph. This visualizer aims to show how A\* is able to find paths around obstacles. Click the title "A\* Algorithm Visualizer Intro" for the link to the actual visualizer :)

This demo uses a 2-dimensional graph (matrix). The backend is coded in C++, which is then exposed to JavaScript using [Emscripten](https://emscripten.org).

**Table of Contents:**
1. [A\* Algorithm Background](#a-algorithm-background)
2. [Code Documentation](#code-documentation)
3. A list of my struggles with WASM and how I overcame those 😭
4. Credits to open source visual assets

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

With all these needs in mind, we can create this Node struct, where doubles F and G represent F- and G-scores respectively, while integers X and Y represent the coordinates of the node. The constructor will never be needed for anything other than declaring a node with all of these variables filled in, so it requires a 4-variable input:
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

Now, we can create the priority queue:
```cpp
priority_queue<Node, vector<Node>, decltype(comp)> OPEN(comp);
```

We must start somewhere, so we will insert the starting node into the priority queue. 



