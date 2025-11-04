use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DN {
    pub id: u8,
    pub number: i16,
    pub name: String,
    pub label: String,
    pub pickup_group: Option<i8>,
}
