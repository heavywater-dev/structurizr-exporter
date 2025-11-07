workspace "Test System" "A simple test system for the exporter" {

    model {
        user = person "User" "A user of the system"
        
        system = softwareSystem "Test System" "A simple test system" {
            webApp = container "Web Application" {
                description "The main web application"
                technology "React"
            }
            api = container "API" {
                description "The REST API"
                technology "Node.js"
            }
            database = container "Database" {
                description "The main database"
                technology "PostgreSQL"
                tags "Database"
            }
        }

        user -> system "Uses"
        user -> webApp "Visits" "HTTPS"
        webApp -> api "Makes calls to" "JSON/HTTPS"
        api -> database "Reads from and writes to" "JDBC"
    }

    views {
        systemContext system "SystemContext" {
            include *
            autolayout lr
            title "System Context"
            description "The system context diagram"
        }

        container system "Containers" {
            include *
            autolayout tb  
            title "Container View"
            description "The container diagram"
        }

        styles {
            element "Person" {
                shape person
                background #08427b
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Database" {
                shape cylinder
                background #f5da81
                color #000000
            }
            relationship "Relationship" {
                color #707070
                thickness 2
            }
        }
    }
}