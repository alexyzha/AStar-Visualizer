#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>
#include <emscripten/bind.h>
using namespace std;
using std::vector;
using emscripten::val;
using emscripten::allow_raw_pointers;

// to compile and run B/C lambda function: g++ -std=c++11 AStar.cpp -o AStar && ./AStar
// emcc AStar-Client.cpp -o JStar.js --bind -s MODULARIZE=1 -s EXPORT_NAME='createModule' -O2 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS="['_free', '_malloc']" -lembind

EMSCRIPTEN_KEEPALIVE
const vector<pair<int,int>> DIRECTIONS{{0,-1},{0,1},{-1,0},{1,0},{-1,-1},{1,-1},{-1,1},{1,1}};

struct Node {
    double F;
    double G;
    int X;
    int Y;
    Node(double f, int x, int y, double g) : F(f), X(x), Y(y), G(g) {}
};

EMSCRIPTEN_KEEPALIVE
double EuDist(int x1, int y1, int x2, int y2) {
    return sqrt(pow((x2-x1),2) + pow((y2-y1),2));
}

double FixDist(int x1, int y1, int x2, int y2) {
    return abs(x1-x2) + abs(y1-y2) == 1.0 ? 1.0 : sqrt(2);
}

vector<vector<double>> HMap(int col, int row, int tx, int ty) {
    vector<vector<double>> r(row,vector<double>(col,0.0));
    for(int i = 0; i < row; i++) {
        for(int j = 0; j < col; j++) {
            r[i][j] = EuDist(j,i,tx,ty);
        }
    }
    return r;
}

vector<pair<int,int>> N_FXN(const vector<vector<int>>& map, const vector<vector<bool>>& CLOSED, int x, int y) {
    vector<pair<int,int>> r;
    for (auto& d : DIRECTIONS) {
        int nx = x + d.first;
        int ny = y + d.second;
        if(nx >= 0 && nx < map[0].size() && ny >= 0 && ny < map.size() && !CLOSED[ny][nx]) r.push_back({nx, ny});
    }
    return r;
}

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

vector<int> AStar(int COL, int ROW, int sx, int sy, int tx, int ty, vector<int> B_COORD) {
    vector<vector<int>> M_MAP(ROW,vector<int>(COL,0));
    for(int x=0,y=1; y < B_COORD.size(); x+=2,y+=2) {
        M_MAP[B_COORD[y]][B_COORD[x]] = 1;
    }

    const vector<vector<double>> H_MAP = HMap(M_MAP[0].size(),M_MAP.size(),tx,ty);
    vector<vector<bool>> CLOSED(M_MAP.size(), vector<bool>(M_MAP[0].size(),0));
    for(int i = 0; i < M_MAP.size(); i++) {
        for(int j = 0; j < M_MAP[0].size(); j++) {
            if(M_MAP[i][j] == 1) CLOSED[i][j] = 1;
        }
    }
    vector<vector<pair<int,int>>> RELATION(M_MAP.size(),vector<pair<int,int>>(M_MAP[0].size(),pair<int,int>(-1,-1)));
    vector<vector<double>> BEST_G(M_MAP.size(), vector<double>(M_MAP[0].size(), numeric_limits<double>::infinity()));
    BEST_G[sy][sx] = 0.0;

    auto comp = [](const Node a, const Node b) { return a.F > b.F; };
    priority_queue<Node, vector<Node>, decltype(comp)> OPEN(comp);
    OPEN.push(Node(H_MAP[sy][sx]+0.0,sx,sy,0.0));
    CLOSED[sy][sx] = 1;

    //A* FUNCTION
    while(OPEN.size()) {
        if(OPEN.top().X == tx && OPEN.top().Y == ty) break;
        int topx = OPEN.top().X, topy = OPEN.top().Y;
        int C_G = OPEN.top().G;
        OPEN.pop();
        vector<pair<int,int>> neighbors = N_FXN(M_MAP,CLOSED,topx,topy);
        for(auto& n : neighbors) {
            int tempx = n.first, tempy = n.second;
            double N_G = C_G + FixDist(topx,topy,tempx,tempy);
            double N_COST = N_G + H_MAP[tempy][tempx];
            if(N_G < BEST_G[tempy][tempx]) {
                BEST_G[tempy][tempx] = N_G;
                OPEN.push(Node(N_COST,tempx,tempy,N_G));
                RELATION[tempy][tempx] = {topx,topy};
            }
        }
        CLOSED[topy][topx] = 1;
    }
    return ReturnPath(RELATION,tx,ty,M_MAP);
}

EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("AStar", &AStar);
    emscripten::register_vector<int>("VectorInt");
}
