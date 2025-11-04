import { invoke } from "@tauri-apps/api/core";

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

    let phone_tab = document.getElementById("phone-tab")
    phone_tab.addEventListener('click', () => {
        clear_view()
        show_load()
        populate_phones()
        hide_load()
    })

    let pools_tab = document.getElementById("pools-tab")
    pools_tab.addEventListener('click', () => {
        clear_view()
        show_load()
        populate_pools()
        hide_load()
    })
    
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

function populate_pools()
{
    invoke("get_pools")
    .then((s) => {
        console.log(s)
        let main = document.getElementById("main")
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
            number.value = element.number
            number.readOnly = true

            let numberLabel = document.createElement("div")
            numberLabel.innerHTML = "Linked Phone ID:"

            numberContainer.appendChild(numberLabel)
            numberContainer.appendChild(number)

            parent.appendChild(id)
            parent.appendChild(mac)
            parent.appendChild(container)
            container.appendChild(numberContainer)

            let pagingContainer = document.createElement("div")
            let pagingLabel = document.createElement("div")
            pagingLabel.innerHTML = "Paging dn:"

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
/*
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
                            console.log(s)
                            hide_load()
                        })
                    }else
                    {
                        invoke("write_phone", {dn: element.id, name: name.value, number: Number(number.value), label: label.value})
                        .then((s) => {
                            console.log(s)
                            hide_load()
                        })
                    }
                    

                })
                
            })
            
            

            
            
            */
            main.appendChild(parent)
        });
    })
}

function populate_phones()
{
   
    invoke("get_phones")
    .then((s) => {
        let main = document.getElementById("main")
        let phone_arr = JSON.parse(s)
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
                            console.log(s)
                            hide_load()
                        })
                    }else
                    {
                        invoke("write_phone", {dn: element.id, name: name.value, number: Number(number.value), label: label.value})
                        .then((s) => {
                            console.log(s)
                            hide_load()
                        })
                    }
                    

                })
                
            })
            
            

            
            
            
            main.appendChild(parent)
        });
    })
}
