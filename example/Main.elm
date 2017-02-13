module Main exposing (..)

import Model
import Html


something : Int
something =
    Model.add 5 6


main : Html.Html msg
main =
    Html.text "hello"
