# [A* Algorithm Visualizer Intro](https://alexyzha.github.io/AStar-Visualizer/):

A* is an informed search algorithm used to find the shortest possible path between 2 points. This visualizer aims to show how A* is able to find paths around obstacles.

This demo uses a 2-dimensional graph (matrix). The backend is coded in C++, which is then exposed to JavaScript using [Emscripten](https://emscripten.org).

This README page contains:
1. A* algorithm background
2. Code documentation
3. A list of my struggles with WASM and how I overcame those 😭
4. Credits to open source visual assets

# A* Algorithm Background:

You should probably know:
1. [Dijkstra's Algorithm](https://www.youtube.com/watch?v=_lHSawdgXpI)
2. [Some graph theory](https://en.wikipedia.org/wiki/Graph_theory)
3. [Greedy algorithms](https://www.geeksforgeeks.org/greedy-algorithms/)

A* is an algorithm that combines aspects of greedy algorithms (more specifically, heuristics) and Dijkstra's algorithm.

Like Dijkstra's algorithm, A* also searches for the shortest path between 2 nodes in a graph (or 2 tiles in a matrix in this example). Different paths from the starting node are weighted differently, and this aspect of A* is directly borrowed from Dijkstra's algorithm. The algorithm decides on which node to travel to next based on these weights.

A* differs from Dijkstra's algorithm because it uses [heuristics](https://en.wikipedia.org/wiki/Heuristic_(computer_science)) to help calculate the optimal path. The heuristic used for each application of A* will differ, but in general, the heuristic used to aid in calculation estimates the cost (distance in this example) from a node to the end node. This means that A* can prioritize nodes that seem like they're closer to the end node.

By combining aspects from Dijkstra's algorithm and greedy algorithms, A* always accurately finds the shortest path possible.

# Code Documentation:

I will not show the frontend part of this demo, as the algorithm itself matters more.

The file containing all the logic is located in [main/AStar.cpp](https://github.com/alexyzha/AStar-Visualizer/blob/main/AStar.cpp).

Let's start by outlining the setup:
1. This specific example uses a matrix as a map
2. Each node on the map is a matrix tile with coordinates (x,y)
3. We'll allow for 8-directional movement:
  - up
  - down
  - left
  - right
  - up-left
  - up-right
  - down-left
  - down-right
4. We also need a priority queue for shortest path search

So we begin with these C++ standard libraries:
```cpp
#include <iostream>    //for debugging and printing matrix
#include <vector>      //for creating matrix and also for getting return path etc.
#include <algorithm>   //for auxillary functions
#include <queue>       //for the algorithm
using namespace std;   //because i'm lazy and it's not like i'm making my own classes 💀
```











