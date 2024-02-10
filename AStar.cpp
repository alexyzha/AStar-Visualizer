#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>
using namespace std;

// to compile and run B/C lambda function: g++ -std=c++11 AStar.cpp -o AStar && ./AStar

const vector<pair<int,int>> DIRECTIONS{{0,-1},{0,1},{-1,0},{1,0},{-1,-1},{1,-1},{-1,1},{1,1}};

struct Node {
    double F;
    double G;
    int X;
    int Y;
    Node(double f, int x, int y, double g) : F(f), X(x), Y(y), G(g) {}
};

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

void Visualize(vector<vector<pair<int,int>>>& RELATION, int tx, int ty, const vector<vector<int>>& map) {
    vector<vector<string>> r(RELATION.size(),vector<string>(RELATION[0].size(),"0"));
    pair<int,int> C_PAIR = pair<int,int>(tx,ty);
    pair<int,int> I_PAIR = pair<int,int>(-1,-1);
    while(C_PAIR != I_PAIR) {
        r[C_PAIR.second][C_PAIR.first] = "\x1b[92m0\x1b[0m";
        C_PAIR = RELATION[C_PAIR.second][C_PAIR.first];
    }
    for(int i = 0; i < RELATION.size(); i++) {
        for(int j = 0; j < RELATION[0].size(); j++) {
            if(map[i][j] == 1) cout << "\x1b[91m1\x1b[0m ";
            else cout << r[i][j] << " ";
        }
        cout << endl;
    }
}

int main() {
    vector<int> B_COORD{7, 2, 8, 2, 5, 3, 6, 3, 7, 3, 8, 3, 4, 4, 5, 4, 6, 4, 5, 5, 3, 6, 4, 6, 5, 6, 1, 7, 2, 7, 3, 7, 4, 7, 5, 7, 0, 8, 1, 8, 2, 8, 3, 8, 0, 9, 1, 9};
    vector<vector<int>> TEST_MAP(10,vector<int>(10,0));
    for(int x=0,y=1; y < B_COORD.size(); x+=2,y+=2) {
        TEST_MAP[B_COORD[y]][B_COORD[x]] = 1;
    }
    /*
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
    */

    int sx, sy;
    cin >> sx >> sy;
    int tx, ty;
    cin >> tx >> ty;

    const vector<vector<double>> H_MAP = HMap(TEST_MAP[0].size(),TEST_MAP.size(),tx,ty);
    vector<vector<bool>> CLOSED(TEST_MAP.size(), vector<bool>(TEST_MAP[0].size(),0));
    for(int i = 0; i < TEST_MAP.size(); i++) {
        for(int j = 0; j < TEST_MAP[0].size(); j++) {
            if(TEST_MAP[i][j] == 1) CLOSED[i][j] = 1;
        }
    }
    vector<vector<pair<int,int>>> RELATION(TEST_MAP.size(),vector<pair<int,int>>(TEST_MAP[0].size(),pair<int,int>(-1,-1)));
    vector<vector<double>> BEST_G(TEST_MAP.size(), vector<double>(TEST_MAP[0].size(), numeric_limits<double>::infinity()));
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
        vector<pair<int,int>> neighbors = N_FXN(TEST_MAP,CLOSED,topx,topy);
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
    Visualize(RELATION,tx,ty,TEST_MAP);
    return 0;
}
