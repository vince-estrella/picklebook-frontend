import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'


function FindCourtsPage() {

  const [courts, setCourts] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [viewMode, setViewMode] = useState('Grid')

  const navigate = useNavigate()


  useEffect(() => {

    api.get('/courts')
      .then(res => {
        setCourts(res.data)
      })
      .catch(err => {
        console.error(err)
      })

  }, [])



  const filteredCourts = courts.filter(court => {

    const text = search.toLowerCase()

    const matchSearch =
      court.name.toLowerCase().includes(text) ||
      court.address.toLowerCase().includes(text)


    const matchType =
      typeFilter === "All" ||
      court.type === typeFilter


    return matchSearch && matchType

  })



  return (

    <div className="min-h-screen bg-gray-50">

      <Navbar />


      <div className="
        w-full max-w-[1280px]
        mx-auto
        px-12
        pt-24
        flex
        gap-8
      ">



        {/* SIDEBAR */}

        <div className="w-64">

          <div className="flex flex-col gap-8">


            <h2 className="
              text-slate-800
              text-base
              font-normal
            ">
              Filters
            </h2>



            {/* LOCATION */}

            <div className="flex flex-col gap-2">

              <label className="
                text-slate-500
                text-sm
                uppercase
                tracking-wide
              ">
                Location
              </label>


              <input
                type="text"
                placeholder="City or zip code"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                className="
                  w-full
                  bg-white
                  rounded-lg
                  border
                  px-4
                  py-2.5
                  transition-colors
                  duration-150
                  focus:outline-none
                  focus:ring-2
                  focus:ring-green-700/30
                  focus:border-green-700
                "
              />

            </div>




            {/* PRICE */}

            <div className="flex flex-col gap-2">

              <label className="
                text-slate-500
                text-sm
                uppercase
                tracking-wide
              ">
                Price Range (per hr)
              </label>


              <div className="flex items-center gap-2">

                <input
                  placeholder="₱0"
                  className="
                    w-full
                    border
                    rounded-lg
                    px-3
                    py-2
                    transition-colors
                    duration-150
                    focus:outline-none
                    focus:ring-2
                    focus:ring-green-700/30
                    focus:border-green-700
                  "
                />


                <span>-</span>


                <input
                  placeholder="₱1000"
                  className="
                    w-full
                    border
                    rounded-lg
                    px-3
                    py-2
                    transition-colors
                    duration-150
                    focus:outline-none
                    focus:ring-2
                    focus:ring-green-700/30
                    focus:border-green-700
                  "
                />

              </div>

            </div>




            {/* AVAILABILITY */}

            <div className="flex flex-col gap-3">


              <label className="
                text-slate-500
                text-sm
                uppercase
                tracking-wide
              ">
                Availability
              </label>



              <label className="flex gap-2 items-center cursor-pointer group">

                <input type="checkbox" className="accent-green-800 cursor-pointer"/>

                <span className="transition-colors duration-150 group-hover:text-slate-800">Available Today</span>

              </label>



              <label className="flex gap-2 items-center cursor-pointer group">

                <input type="checkbox" className="accent-green-800 cursor-pointer"/>

                <span className="transition-colors duration-150 group-hover:text-slate-800">Instant Book</span>

              </label>




              <label className="flex gap-2 items-center cursor-pointer group">

                <input
                  type="checkbox"
                  checked={typeFilter==="Indoor"}
                  onChange={()=>
                    setTypeFilter(
                      typeFilter==="Indoor"
                      ?"All"
                      :"Indoor"
                    )
                  }
                  className="accent-green-800 cursor-pointer"
                />

                <span className="transition-colors duration-150 group-hover:text-slate-800">Indoor Courts</span>

              </label>



            </div>




            <button
              onClick={()=>{

                setSearch('')
                setTypeFilter('All')

              }}

              className="
                border
                rounded-lg
                py-3
                transition-colors
                duration-150
                hover:bg-gray-100
                hover:border-gray-400
                active:scale-[0.98]
              "
            >
              Reset All Filters
            </button>


          </div>


        </div>





        {/* COURTS SECTION */}


        <div className="
          flex-1
          flex
          flex-col
          gap-8
        ">




          {/* HEADER */}

          <div className="
            flex
            justify-between
            items-end
          ">


            <div>

              <h1 className="
                text-slate-800
                text-xl
                font-medium
              ">
                Available Courts
              </h1>


              <p className="
                text-slate-500
              ">
                Showing {filteredCourts.length} courts near your location
              </p>

            </div>



            <div className="
              bg-white
              border
              rounded-lg
              p-1
              flex
            ">

              <button
                onClick={() => setViewMode('Grid')}
                className={`
                  px-5
                  py-2
                  rounded-md
                  transition-colors
                  duration-150
                  ${
                    viewMode === 'Grid'
                    ? 'bg-green-800 text-white'
                    : 'text-slate-600 hover:bg-gray-100'
                  }
                `}
              >
                Grid
              </button>


              <button
                onClick={() => setViewMode('Map')}
                className={`
                  px-5
                  py-2
                  rounded-md
                  transition-colors
                  duration-150
                  ${
                    viewMode === 'Map'
                    ? 'bg-green-800 text-white'
                    : 'text-slate-600 hover:bg-gray-100'
                  }
                `}
              >
                Map
              </button>


            </div>


          </div>






          {/* COURT CARDS */}


          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-6
          ">


          {
            filteredCourts.map(court=>(


             <div
  key={court.id}
  className="
    bg-white
    rounded-2xl
    border
    overflow-hidden
    transition-all
    duration-200
    hover:shadow-lg
    hover:-translate-y-1
  "
>


{/* IMAGE */}

<div className="
  h-56
  relative
  bg-gray-200
  overflow-hidden
  group
">


{
court.images?.length > 0 ?

<img
  src={court.images[0].imageUrl}
  alt={court.name}
  className="
    w-full
    h-full
    object-cover
    transition-transform
    duration-300
    group-hover:scale-105
  "
/>

:

<div className="
 flex
 items-center
 justify-center
 h-full
 text-gray-400
">
 No Image
</div>

}



{/* Rating */}

<div className="
 absolute
 top-4
 left-4
 bg-white/90
 rounded-full
 px-3
 py-1
 flex
 items-center
 gap-1
 shadow
">

<span>
⭐
</span>

<span className="
 font-bold
 text-slate-800
">
4.9
</span>

</div>




{/* Type */}

<div className={`
 absolute
 top-4
 right-4
 px-3
 py-1
 rounded-full
 font-bold
 text-sm

 ${
 court.type === "Indoor"
 ?
 "bg-green-100 text-green-800"
 :
 "bg-gray-200 text-gray-700"
 }

`}>

{court.type}

</div>



</div>





{/* CONTENT */}

<div className="
 p-6
">


<div className="
 flex
 justify-between
 items-start
">



<div>


<h2 className="
 text-slate-800
 font-medium
">

{court.name}

</h2>



<p className="
 text-slate-500
 text-sm
 mt-1
">

📍 {court.address}

</p>


</div>





<div className="
 text-right
">


<p className="
 text-green-800
 font-bold
">

₱{court.pricePerHour}

</p>


<p className="
 text-slate-500
 text-sm
">

per hour

</p>


</div>



</div>







{/* AVAILABLE SLOTS */}

<div className="
 mt-5
">


<h3 className="
 text-slate-500
 text-sm
 font-bold
 uppercase
 tracking-wide
 mb-3
">

Next Available Slots

</h3>



<div className="
 flex
 gap-2
">


<button
className="
 px-4
 py-2
 rounded-lg
 border
 border-green-800
 text-green-800
 transition-colors
 duration-150
 hover:bg-green-800
 hover:text-white
"
>
04:00 PM
</button>



<button
className="
 px-4
 py-2
 rounded-lg
 border
 border-green-800
 text-green-800
 transition-colors
 duration-150
 hover:bg-green-800
 hover:text-white
"
>
05:30 PM
</button>



<button
disabled
className="
 px-4
 py-2
 rounded-lg
 bg-gray-100
 text-gray-500
 line-through
 cursor-not-allowed
"
>
07:00 PM
</button>



</div>


</div>







{/* BOOK BUTTON */}

<button

onClick={() =>
 navigate(`/courts/${court.id}`)
}

className="
 mt-8
 w-full
 bg-green-800
 text-white
 py-3.5
 rounded-xl
 font-medium
 transition-all
 duration-150
 hover:bg-green-700
 hover:shadow-md
 active:scale-[0.98]
"

>

Book Now

</button>



</div>


</div>



            ))
          }


          </div>



        </div>



      </div>


    </div>

  )

}


export default FindCourtsPage
