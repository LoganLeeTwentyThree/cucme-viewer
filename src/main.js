import { invoke } from "@tauri-apps/api/core";

let phone_arr = []
let CONFIG = ""

document.addEventListener("DOMContentLoaded", () =>{
    let ip = ''
    while (ip == '')
    {
        ip = prompt("Enter the ssh ip")
    }

    let user = ''
    while (user == '')
    {
        user = prompt("Enter the ssh username")
    }
    
    let password = ''
    while (password == '')
    {
        password = prompt("Enter the ssh password")
    }
    
    invoke("set_credentials", {ip: ip, user: user, password: password})
    invoke("get_config").then((cfg) => {
        CONFIG = cfg
        populate_phones()

        document.getElementById("phone-tab").addEventListener('click', () => {
            clear_view()
            show_load()
            populate_phones()
            hide_load()
        })

        document.getElementById("pools-tab").addEventListener('click', () => {
            clear_view()
            show_load()
            populate_pools()
            hide_load()
        })

        document.getElementById("hunt-group-tab").addEventListener('click', () => {
            
            clear_view()
            show_load()
            populate_hunt_groups()
            hide_load()
            
        })
    });

    
    
})


function clear_view()
{
    document.getElementById("main").innerHTML = ''
}

function show_load()
{
    document.getElementById('loading-spinner').style.display = 'block'
}

function hide_load()
{
    document.getElementById('loading-spinner').style.display = 'none'
}

function populate_hunt_groups()
{
    invoke("get_hunt_groups", {config: CONFIG})
    .then((s) => {
        let main = document.getElementById("main")
        let info = document.createElement("div")
        info.classList = "info"
        info.innerHTML = "A hunt group is a group of extensions that can all be called at the same time by calling the pilot number."
        main.appendChild(info)

        let hg_arr = JSON.parse(s)
        hg_arr.forEach((element) => {
            let parent = document.createElement("div")
            parent.classList = "card"

            let name = document.createElement("input")
            name.value = element.name
            name.classList = "name"

            let id = document.createElement("div")
            id.innerHTML = element.id
            id.classList = "id"

            let numberContainer = document.createElement("div")
            numberContainer.classList = "number"
            
            let pilotLabel = document.createElement("div")
            pilotLabel.innerHTML = "Pilot Extension:"

            let pilot = document.createElement("input")
            pilot.value = element.pilot

            numberContainer.appendChild(pilotLabel)
            numberContainer.appendChild(pilot)

            let listLabel = document.createElement("div")
            listLabel.innerHTML = "List:"

            numberContainer.appendChild(listLabel)

            let list = JSON.parse("[" + element.list + "]")
            let listView = document.createElement("div")
            listView.style.overflowY = "scroll"
            listView.style.height = "80px"

            function createListElement(num) {
                let listElementContainer = document.createElement("div")
                listElementContainer.style.display = "flex"

                let listE = document.createElement("input")
                listE.value = num
                listE.classList = "removable"

                let remove = document.createElement("div")
                remove.classList = "remove-button"
                remove.addEventListener('click', () => {
                    if(listView.children.length > 2)
                    {
                        listElementContainer.remove()
                    }else
                    {
                        alert("Group must have at least 2 extensions!")
                    }
                    
                })

                let minusIcon = document.createElement("i")
                minusIcon.classList = "fa-solid fa-minus"
                minusIcon.style.width = "100%"
                minusIcon.style.height = "100%"
                remove.appendChild(minusIcon)
                

                listElementContainer.appendChild(listE)
                listElementContainer.appendChild(remove)

                

                listView.appendChild(listElementContainer)
            }

            list.forEach(createListElement)

            let addButton = document.createElement("button")
            addButton.innerHTML = "Add Extension"

            addButton.addEventListener('click', () => {

                createListElement("Enter Extension")

            })


            let submitButton = document.createElement("button")
            submitButton.innerHTML = "Submit"

            submitButton.addEventListener('click', () => {
                let extList = ""
                Array.from(listView.getElementsByTagName("input")).forEach((element) => {
                    
                    if( !isNaN(element.value) )
                    {
                        extList += element.value + ","
                    }
                    
                })

                show_load()
                invoke('write_voice_hunt_group', {list : extList, id : Number(element.id), pilot : Number(pilot.value), name: name.value})
                .then(() => {
                    hide_load()
                })
            })

            numberContainer.appendChild(listView)
            numberContainer.appendChild(addButton)
            numberContainer.appendChild(submitButton)
            
            
            parent.appendChild(id)
            parent.appendChild(name)
            parent.appendChild(numberContainer)
            main.appendChild(parent)
        })

        
    })
}

function populate_pools()
{
    invoke("get_pools", {config: CONFIG})
    .then((s) => {
        let main = document.getElementById("main")
        let info = document.createElement("div")
        info.classList = "info"
        info.innerHTML = "Each pool represents a physical phone device. It holds the paging number as well as mac address."
        main.appendChild(info)

        let restartAll = document.createElement("button")
        restartAll.innerHTML = "Restart All Phones"
        restartAll.addEventListener('click', () => {
            restartAll.disabled = true
            invoke("restart_all_phones").then(() => { restartAll.disabled = false } )
        })
        main.appendChild(restartAll)

        let pool_arr = JSON.parse(s)
        pool_arr.forEach(element => {
            let parent = document.createElement("div")
            parent.classList = "card"
            
            let mac = document.createElement("input")
            mac.readOnly = true
            mac.value = element.mac
            mac.classList = "name"

            let id = document.createElement("div")
            id.innerHTML = element.id
            id.classList = "id"

            let container = document.createElement("div")
            container.classList = "number"

            let numberContainer = document.createElement("div")
            
            let number = document.createElement("input")
            number.value = element.dn
            number.readOnly = true

            let numberLabel = document.createElement("div")
            numberLabel.innerHTML = "Linked Phone ID:"

            let nameLabel = document.createElement("div")
            nameLabel.innerHTML = "Linked Phone Name:"

            let name = document.createElement("input")
            name.value = phone_arr.find((e) => 
            {
                return e.id == element.dn 
            }).name
            name.readOnly = true

            numberContainer.appendChild(numberLabel)
            numberContainer.appendChild(number)
            numberContainer.appendChild(nameLabel)
            numberContainer.appendChild(name)

            parent.appendChild(id)
            parent.appendChild(mac)
            parent.appendChild(container)
            container.appendChild(numberContainer)

            let pagingContainer = document.createElement("div")
            let pagingLabel = document.createElement("div")
            pagingLabel.innerHTML = "Paging DN:"

            let paging = document.createElement("input")
            if(element.paging_dn != null)
            {
                paging.value = element.paging_dn
            }else
            {
                paging.value = "None" 
            }

            pagingContainer.appendChild(pagingLabel)
            pagingContainer.appendChild(paging)
            container.appendChild(pagingContainer)

            let restart = document.createElement("button")
            restart.innerHTML = "Restart"
            container.appendChild(restart)

            restart.addEventListener('click', () => {
                
                invoke('restart_phone', {pool: Number(element.id)});
            })
            
            

            
            
            
            main.appendChild(parent)
        });
    })
}

function populate_phones()
{
   
    invoke("get_phones", {config: CONFIG})
    .then((s) => {
        let main = document.getElementById("main")
        let info = document.createElement("div")
        info.classList = "info"
        info.innerHTML = "Each voice register dn holds information about a specific phone: the label, the extension, the name, and the pickup group. The label is displayed on the screen, while the name is displayed for caller ID."
        main.appendChild(info)
        
        phone_arr = JSON.parse(s)
        phone_arr.forEach(element => {
            let parent = document.createElement("div")
            parent.classList = "card"
            
            let name = document.createElement("input")
            name.readOnly = true
            name.value = element.name
            name.classList = "name"

            let id = document.createElement("div")
            id.innerHTML = element.id
            id.classList = "id"

            let container = document.createElement("div")
            container.classList = "number"

            let numberContainer = document.createElement("div")
            
            let number = document.createElement("input")
            number.value = element.number
            number.readOnly = true

            let numberLabel = document.createElement("div")
            numberLabel.innerHTML = "Extension:"

            numberContainer.appendChild(numberLabel)
            numberContainer.appendChild(number)
            
            let labelContainer = document.createElement("div")

            let label = document.createElement("input")
            label.readOnly = true
            label.value = element.label

            let labelLabel = document.createElement("div")
            labelLabel.innerHTML = "Label:"

            labelContainer.appendChild(labelLabel)
            labelContainer.appendChild(label)

            parent.appendChild(id)
            parent.appendChild(name)
            parent.appendChild(container)
            container.appendChild(numberContainer)
            container.appendChild(labelContainer)

            let pickupContainer = document.createElement("div")
            let pickupLabel = document.createElement("div")
            pickupLabel.innerHTML = "Pickup Group:"

            let pickup = document.createElement("input")
            if(element.pickup_group != null)
            {
                pickup.value = element.pickup_group
            }else
            {
                pickup.value = "None" 
            }

            pickupContainer.appendChild(pickupLabel)
            pickupContainer.appendChild(pickup)
            container.appendChild(pickupContainer)

            let edit = document.createElement("button")
            edit.innerHTML = "Edit"
            container.appendChild(edit)

            edit.addEventListener('click', () => {
                name.readOnly = false;
                number.readOnly = false;
                label.readOnly = false;
                parent.style = "border: 2px solid yellow;"

                let submit = document.createElement("button")
                submit.innerHTML = "Submit"
                container.appendChild(submit)
                edit.disabled = true

                document.addEventListener('click', function(event) {
                    if (event.target !== parent && !parent.contains(event.target)) {
                        edit.disabled = false
                        container.removeChild(submit)
                        name.readOnly = true;
                        number.readOnly = true;
                        label.readOnly = true;
                        parent.style = ""
                        document.removeEventListener('click')
                        
                        
                    }
                });

                submit.addEventListener('click', () =>{
                    show_load();
                    if(typeof Number(pickup.value) == 'number')
                    {
                        invoke("write_phone", {dn: element.id, name: name.value, number: Number(number.value), label: label.value, pickup: Number(pickup.value)})
                        .then((s) => {
                            hide_load()
                            clear_view()
                            invoke("get_config").then((cfg) => CONFIG = cfg)
                        })
                    }else
                    {
                        invoke("write_phone", {dn: element.id, name: name.value, number: Number(number.value), label: label.value})
                        .then((s) => {
                            hide_load()
                            clear_view()
                            invoke("get_config").then((cfg) => CONFIG = cfg)
                        })
                    }

                    

                    
                    

                })
                
            })
            
            

            
            
            
            main.appendChild(parent)
        });
    })
}
