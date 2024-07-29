# Terminology
**Panel** — This refers to Pterodactyl Panel itself, and is what allows you to add additional
nodes and servers to the system.

**Node** — A node is a physical machine that runs an instance of Wings.

**Wings** — The newer service written in Go that interfaces with Docker and the Panel to provide secure access for
controlling servers via the Panel.

**Server** — In this case, a server refers to a running instance that is created by the panel. These servers are
created on nodes, and you can have multiple servers per node.

**Docker** — Docker is a platform that lets you separate the application from your infrastructure into isolated, secure containers.

**Docker Image**  — A Docker image contains everything needed to run a containerized application. (e.g. Java for a Minecraft Server).

**Container** — Each server will be running inside an isolated container to enforce hardware limitations
(such as CPU and RAM) and avoid any interference between servers on one node. These are created by Docker.

**Nest** — Each nest is usually used as a specific game or service, for example: Minecraft, Teamspeak or Terraria and can contain many eggs.

**Egg**  — Each egg is usually used to store the configuration of a specific type of game, for example: Vanilla, Spigot or Bungeecord for Minecraft.

**Yolks**  — A curated collection of core docker images that can be used with Pterodactyl's Egg system.


## Simple Setup Diagram
```mermaid
flowchart TD
    Panel[Panel] --> Node1[Node #1]
    Panel[Panel] --> Node2[Node #2]
    Panel[Panel] --> Node3[Node #n]

    Node1 ---> Server1[Server #1]
    Node1 ---> Server2[Server #2]
    Node1 ---> Server3[Server #3]
    Node1 ---> Server4[Server #n]

    Server1 --> Nest1[Nest #1]
    Server1 --> Nest2[Nest #2]

    Nest1 --> Eggs1[Eggs #1]

    Eggs1 --> Yolk11[Yolk #1]
    Eggs1  --> Yolk12[Yolk #2]  
```

## Advanced Setup Diagram
::: tip Panel and Wings on the same machine
It is also possible to install wings on the panel machine so it acts as panel and node machine at once.
:::



```mermaid
flowchart LR

    subgraph P[ Panel Machine ]
        Redis[(Redis)]
        Database[(Database<br> 'MySQL/MariaDB')]
        subgraph Web[Webserver <br> 'Nginx/Apache']
            Panel[Panel]
        end
    end

    subgraph N[Node Machines]
        Wings[Wings]
        subgraph Docker[Docker]
            subgraph C[Container]
                subgraph Server[Server]
                end
            end
        end
    end


    admin((Administrator))<-->|80 & 443| Web
    player1((Player #1))<-->|Node IP : Game Port#| Server
    player2((Player #n))<-->|Node IP : Game Port#| Server
    Server ~~~ player1 
    Server ~~~ player2 

    Panel <--> |3306| Database
    Panel <--> |6379| Redis
    Panel <--> |8080/8443 & 2022| Wings
    Panel ---o |IP Address | N
    Wings <--> Docker
    


    style N fill:blue,stroke:black,stroke-width:2px,color:#fff
    style P fill:blue,stroke:black,stroke-width:2px,color:#fff
    style C fill:blue,stroke:black,stroke-width:2px,color:#fff

    style Panel fill:red,stroke:black,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
    style Wings fill:red,stroke:black,stroke-width:2px,color:#fff,stroke-dasharray: 5 5

    style Redis fill:green,stroke:black,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
    style Database fill:green,stroke:black,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
    style Web fill:green,stroke:black,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
    style Docker fill:green,stroke:black,stroke-width:2px,color:#fff,stroke-dasharray: 5 5

    style Server fill:yellow,stroke:black,stroke-width:2px,color:black,stroke-dasharray: 5 5
   
```

```mermaid
flowchart LR
    subgraph Legend
    
        b["Blue = '(Virtual)' Server/ Machine or Container"]
        style b fill:blue,stroke:black,stroke-width:2px,color:#fff

        g["Green = Dependency Software"]
        style g fill:Green,stroke:black,stroke-width:2px,color:#fff

        r["Red = Pterodactyl"]
        style r fill:Red,stroke:black,stroke-width:2px,color:#fff

        y["Yellow = Pterodactyl"]
        style y fill:Yellow,stroke:black,stroke-width:2px,color:black
        
        subgraph a[Arrows]
            direction LR
            start1[ ] <--->|Communication| stop1[ ]
            style start1 height:0px;
            style stop1 height:0px;
            start2[ ] ---o|'has' Relation| stop2[ ]
            style start2 height:0px;
            style stop2 height:0px; 
        end
    end

```
